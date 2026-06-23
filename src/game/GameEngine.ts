import type {
  AbilityId,
  GameSnapshot,
  ShipId,
  TowerId,
  UpgradeId,
  Vec2,
  ResourceMap,
  ShipDef,
  TowerDef,
} from "./types";
import { World } from "./world";
import { computeBonuses } from "./bonuses";
import { ResourceManager } from "./managers/ResourceManager";
import { UpgradeManager } from "./managers/UpgradeManager";
import { WaveManager } from "./managers/WaveManager";
import { EnemyManager } from "./managers/EnemyManager";
import { TowerManager } from "./managers/TowerManager";
import { ShipManager } from "./managers/ShipManager";
import { ProjectileManager } from "./managers/ProjectileManager";
import { AbilityManager } from "./managers/AbilityManager";
import { DragonManager } from "./managers/DragonManager";
import { TOWER_DEFS } from "./data/towers";
import { SHIP_DEFS } from "./data/ships";
import { ABILITY_DEFS } from "./data/abilities";
import {
  BASE_ISLAND_HP,
  DPS_WINDOW,
  SPEED_OPTIONS,
  AUTOSAVE_INTERVAL,
  WAVE,
} from "./config";
import { saveGame, type SaveData } from "./save";

const FIXED_DT = 1 / 60;

export class GameEngine {
  world: World;
  res: ResourceManager;
  up: UpgradeManager;
  waves: WaveManager;
  enemies: EnemyManager;
  towers: TowerManager;
  ships: ShipManager;
  projectiles: ProjectileManager;
  abilities: AbilityManager;
  dragons: DragonManager;

  speed = 1;
  autoAdvance = true;
  gameOver = false;
  armedAbility: AbilityId | null = null;
  bannerText: string | null = null;
  private bannerTimer = 0;
  eventToast: { title: string; body: string } | null = null;

  private accumulator = 0;
  private lastTime = 0;
  private rafId = 0;
  private autosaveTimer = 0;
  private listeners = new Set<() => void>();
  private snapshot: GameSnapshot;

  constructor(save?: SaveData | null) {
    this.res = new ResourceManager(save?.resources);
    this.up = new UpgradeManager(save?.upgrades);
    this.waves = new WaveManager();
    this.enemies = new EnemyManager();
    this.towers = new TowerManager();
    this.ships = new ShipManager();
    this.projectiles = new ProjectileManager();
    this.abilities = new AbilityManager();
    this.dragons = new DragonManager(save?.dragon);

    const maxIslandHp = BASE_ISLAND_HP;
    this.world = {
      enemies: [],
      towers: [],
      ships: [],
      projectiles: [],
      effects: [],
      islandHp: save?.islandHp ?? maxIslandHp,
      maxIslandHp,
      bonuses: computeBonuses(this.up, this.dragons.state),
      rallyUntil: 0,
      rallyMult: 1,
      time: 0,
      damageEvents: [],
      bossKills: 0,
      shipsOwned: { cutter: 0, gunboat: 0, sloop: 0 },
    };

    if (save) this.applySave(save);

    this.snapshot = this.buildSnapshot();
  }

  // ------------------------------------------------------------------ save
  private applySave(save: SaveData): void {
    this.waves.load(save.wave);
    this.autoAdvance = save.autoAdvance ?? true;
    // Rebuild towers
    for (const t of save.towers ?? []) {
      this.towers.build(this.world, t.defId, t.slotIndex);
    }
    // Rebuild ships
    for (const id of Object.keys(save.shipsOwned ?? {}) as ShipId[]) {
      const count = save.shipsOwned[id] ?? 0;
      for (let i = 0; i < count; i++) this.ships.add(this.world, id);
    }
    this.refreshDerived();
  }

  toSave(): SaveData {
    return {
      version: 1,
      resources: this.res.res,
      upgrades: this.up.levels,
      wave: this.waves.wave,
      islandHp: this.world.islandHp,
      autoAdvance: this.autoAdvance,
      towers: this.world.towers.map((t) => ({
        defId: t.defId,
        slotIndex: t.slotIndex,
      })),
      shipsOwned: { ...this.world.shipsOwned },
      dragon: this.dragons.state,
    };
  }

  // ------------------------------------------------------------------ loop
  start(): void {
    this.lastTime = performance.now();
    const loop = (now: number) => {
      this.rafId = requestAnimationFrame(loop);
      const realDt = Math.min(0.1, (now - this.lastTime) / 1000);
      this.lastTime = now;
      this.tick(realDt);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
  }

  private tick(realDt: number): void {
    if (!this.gameOver) {
      this.accumulator += realDt * this.speed;
      let steps = 0;
      while (this.accumulator >= FIXED_DT && steps < 600) {
        this.step(FIXED_DT);
        this.accumulator -= FIXED_DT;
        steps++;
      }
    }

    // Real-time concerns (banner timer, autosave, snapshot push)
    if (this.bannerTimer > 0) {
      this.bannerTimer -= realDt;
      if (this.bannerTimer <= 0) this.bannerText = null;
    }
    this.autosaveTimer += realDt;
    if (this.autosaveTimer >= AUTOSAVE_INTERVAL) {
      this.autosaveTimer = 0;
      saveGame(this.toSave());
    }

    this.snapshot = this.buildSnapshot();
    this.emit();
  }

  private step(dt: number): void {
    const w = this.world;
    w.time += dt;

    // Mana regen
    this.res.add("mana", w.bonuses.manaRegen * dt);
    this.res.clampMana(w.bonuses.maxMana);

    // Wave spawning
    this.waves.update(w, dt, this.enemies);

    // Combat
    const goldScale = this.waves.goldScale();
    this.towers.update(w, dt, (tower, target) => {
      const def: TowerDef = TOWER_DEFS[tower.defId];
      const dmg = def.damage * w.bonuses.towerDamageMult(tower.defId);
      this.projectiles.spawn(
        w,
        tower.pos,
        target.pos,
        dmg,
        def.splash,
        def.bossMultiplier,
        def.color,
        target.uid,
        def.projectileSpeed
      );
    });

    this.ships.update(w, dt, (ship, from, target) => {
      const def: ShipDef = SHIP_DEFS[ship.defId];
      const dmg = def.damage * w.bonuses.shipDamageMult;
      this.projectiles.spawn(w, from, target.pos, dmg, 0, 1, def.color, target.uid, 460);
    });

    this.projectiles.update(w, dt, this.res, goldScale, (amt) => {
      this.res.add("mana", amt);
      this.res.clampMana(w.bonuses.maxMana);
    });

    // Boss defeat → dragon trust (drain kills recorded at the kill sites)
    if (w.bossKills > 0) {
      for (let i = 0; i < w.bossKills; i++) this.dragons.onBossDefeated();
      w.bossKills = 0;
      this.refreshDerived();
    }

    // Enemy movement + core damage
    this.enemies.update(w, dt);

    // Abilities cooldowns
    this.abilities.update(dt);

    // Effects decay
    for (const fx of w.effects) fx.life -= dt;
    w.effects = w.effects.filter((fx) => fx.life > 0);

    // DPS event pruning
    const cutoff = w.time - DPS_WINDOW;
    w.damageEvents = w.damageEvents.filter((d) => d.t >= cutoff);

    // Wave end → auto-advance + rewards
    if (!this.waves.active && w.enemies.length === 0) {
      this.onWaveCleared();
    }

    // Island destroyed
    if (w.islandHp <= 0 && !this.gameOver) {
      this.gameOver = true;
      this.showBanner("The Tidehold Has Fallen", 9999);
    }
  }

  private onWaveCleared(): void {
    if (this.waves.wave === 0) {
      // Game just started; begin wave 1
      this.startWave();
      return;
    }
    // Wave-clear gold bonus
    const bonus = 10 * Math.pow(1.08, this.waves.wave) * this.world.bonuses.goldMult;
    this.res.add("gold", bonus);

    // Dragon egg discovery
    if (this.dragons.checkEggDiscovery(this.waves.wave)) {
      this.eventToast = {
        title: "A Dragon Egg!",
        body: "Hidden in plundered cargo, you find a living dragon egg. Fog rolls in. Jasper Barrow's lantern flickers in the mist — the island is now part of something far larger. Claim the egg to begin the sanctuary.",
      };
    }

    if (this.autoAdvance && !this.gameOver) {
      this.startWave();
    }
  }

  // ------------------------------------------------------------- public API
  startWave(): void {
    if (this.gameOver || this.waves.active) return;
    this.waves.startNextWave();
    const w = this.waves.wave;
    if (this.waves.isBossWave(w)) {
      this.showBanner(`Wave ${w}: Egg-Runner Captain`, 4);
    } else if (w % 10 === 0) {
      this.showBanner(`Wave ${w}: The Tide Rises`, 3);
    }
  }

  buildTower(defId: TowerId, slotIndex: number): boolean {
    const def = TOWER_DEFS[defId];
    if (!this.res.canAfford(def.buildCost)) return false;
    if (!this.res.spend(def.buildCost)) return false;
    const t = this.towers.build(this.world, defId, slotIndex);
    if (!t) {
      this.res.addMap(def.buildCost); // refund on failure
      return false;
    }
    this.refreshDerived();
    this.pushSnapshot();
    return true;
  }

  buyShip(defId: ShipId): boolean {
    const def = SHIP_DEFS[defId];
    if (!this.res.spend(def.buildCost)) return false;
    this.ships.add(this.world, defId);
    this.pushSnapshot();
    return true;
  }

  buyUpgrade(id: UpgradeId): boolean {
    const ok = this.up.buy(id, this.res);
    if (ok) {
      this.refreshDerived();
      this.pushSnapshot();
    }
    return ok;
  }

  armAbility(id: AbilityId): void {
    const def = ABILITY_DEFS[id];
    if (def.targeted) {
      this.armedAbility = this.armedAbility === id ? null : id;
    } else {
      this.castAbility(id);
    }
    this.pushSnapshot();
  }

  /** Called by canvas click. If an ability is armed & targeted, cast at point. */
  onBattlefieldClick(point: Vec2): boolean {
    if (this.armedAbility) {
      const ok = this.castAbility(this.armedAbility, point);
      this.armedAbility = null;
      this.pushSnapshot();
      return ok;
    }
    return false;
  }

  castAbility(id: AbilityId, target?: Vec2): boolean {
    const ok = this.abilities.cast(id, {
      world: this.world,
      res: this.res,
      ships: this.ships,
      projectiles: this.projectiles,
      goldScale: this.waves.goldScale(),
      target,
      onManaFromKill: (amt) => {
        this.res.add("mana", amt);
        this.res.clampMana(this.world.bonuses.maxMana);
      },
    });
    return ok;
  }

  setSpeed(s: number): void {
    if (SPEED_OPTIONS.includes(s)) {
      this.speed = s;
      this.pushSnapshot();
    }
  }

  toggleAutoAdvance(): void {
    this.autoAdvance = !this.autoAdvance;
    if (this.autoAdvance && !this.waves.active && !this.gameOver) {
      this.startWave();
    }
    this.pushSnapshot();
  }

  claimEgg(): void {
    this.dragons.claimEgg();
    this.eventToast = null;
    this.refreshDerived();
    this.pushSnapshot();
  }

  dismissToast(): void {
    this.eventToast = null;
    this.pushSnapshot();
  }

  reset(): void {
    saveGame(null);
    window.location.reload();
  }

  // ------------------------------------------------------------- internals
  private refreshDerived(): void {
    this.world.bonuses = computeBonuses(this.up, this.dragons.state);
    this.world.maxIslandHp = BASE_ISLAND_HP;
    this.res.clampMana(this.world.bonuses.maxMana);
  }

  private showBanner(text: string, seconds: number): void {
    this.bannerText = text;
    this.bannerTimer = seconds;
  }

  // ------------------------------------------------------------- snapshot
  private buildSnapshot(): GameSnapshot {
    const w = this.world;
    const dpsTotal = w.damageEvents.reduce((a, d) => a + d.amount, 0);
    const dps = dpsTotal / DPS_WINDOW;

    return {
      resources: { ...this.res.res },
      maxMana: w.bonuses.maxMana,
      wave: this.waves.wave,
      waveActive: this.waves.active,
      enemiesRemaining: w.enemies.length,
      islandHp: w.islandHp,
      maxIslandHp: w.maxIslandHp,
      dps,
      timeSurvived: w.time,
      speed: this.speed,
      autoAdvance: this.autoAdvance,
      gameOver: this.gameOver,
      bossWave: this.waves.isBossWave(),
      upgradeLevels: { ...this.up.levels },
      shipsOwned: { ...w.shipsOwned },
      towerCount: w.towers.length,
      abilities: {
        barrage: { ...this.abilities.states.barrage },
        rally: { ...this.abilities.states.rally },
        broadside: { ...this.abilities.states.broadside },
        repairs: { ...this.abilities.states.repairs },
      },
      dragon: { ...this.dragons.state },
      armedAbility: this.armedAbility,
      bannerText: this.bannerText,
      eventToast: this.eventToast,
    };
  }

  getSnapshot = (): GameSnapshot => this.snapshot;

  private pushSnapshot(): void {
    this.snapshot = this.buildSnapshot();
    this.emit();
  }

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  private emit(): void {
    for (const cb of this.listeners) cb();
  }

  // Helpers for UI cost display
  towerDef(id: TowerId): TowerDef {
    return TOWER_DEFS[id];
  }
  shipDef(id: ShipId): ShipDef {
    return SHIP_DEFS[id];
  }
  canAfford(cost: Partial<ResourceMap>): boolean {
    return this.res.canAfford(cost);
  }
  upgradeCost(id: UpgradeId): Partial<ResourceMap> {
    return this.up.cost(id);
  }

  // Tower slot info for the renderer / build menu
  slotInfo(): { index: number; pos: Vec2; occupied: boolean }[] {
    const occ = this.towers.occupiedSlots(this.world);
    const out = [];
    for (let i = 0; i < 8; i++) {
      out.push({ index: i, pos: this.towers.slotPos(i), occupied: occ.has(i) });
    }
    return out;
  }
}

export { WAVE };
