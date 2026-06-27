import type {
  AbilityId,
  DragonAbilityId,
  DragonId,
  GameSnapshot,
  SelectedTowerInfo,
  SelectedTowerUpgrade,
  ShipId,
  TowerId,
  TowerUpgradeKind,
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
import { FactionManager } from "./managers/FactionManager";
import { EnemyManager } from "./managers/EnemyManager";
import { TowerManager } from "./managers/TowerManager";
import { ShipManager } from "./managers/ShipManager";
import { ProjectileManager } from "./managers/ProjectileManager";
import { AbilityManager } from "./managers/AbilityManager";
import { DragonManager } from "./managers/DragonManager";
import { TOWER_DEFS } from "./data/towers";
import { SHIP_DEFS } from "./data/ships";
import { ABILITY_DEFS } from "./data/abilities";
import { DRAGON_ABILITY_DEFS } from "./data/dragons";
import { FACTION_DEFS } from "./data/factions";
import { ENEMY_DEFS } from "./data/enemies";
import {
  BASE_ISLAND_HP,
  DPS_WINDOW,
  SPEED_OPTIONS,
  AUTOSAVE_INTERVAL,
  TOWER_SLOT_COUNT,
  WAVE,
} from "./config";
import { saveGame, type SaveData } from "./save";

const FIXED_DT = 1 / 60;
/** UI snapshot cadence (seconds). Decouples React re-renders from the 60fps sim. */
const SNAPSHOT_INTERVAL = 0.1;

export class GameEngine {
  world: World;
  res: ResourceManager;
  up: UpgradeManager;
  factions: FactionManager;
  waves: WaveManager;
  enemies: EnemyManager;
  towers: TowerManager;
  ships: ShipManager;
  projectiles: ProjectileManager;
  abilities: AbilityManager;
  dragons: DragonManager;

  speed = 1;
  autoAdvance = true;
  autoRetry = false;
  /** Auto-advance stops once this wave is cleared (0 = endless). */
  targetWave = 0;
  gameOver = false;
  /**
   * True while we are idle between waves (current wave cleared, next not yet
   * started). Guards `onWaveCleared` so its rewards fire exactly once per wave
   * rather than every idle step.
   */
  private betweenWaves = false;
  /** Uid of the placed tower currently selected for per-tower upgrades. */
  selectedTowerUid: number | null = null;
  armedAbility: AbilityId | null = null;
  /** A targeted dragon ability awaiting a battlefield click, if any. */
  armedDragonAbility: DragonAbilityId | null = null;
  bannerText: string | null = null;
  private bannerTimer = 0;
  eventToast: { title: string; body: string } | null = null;

  private accumulator = 0;
  private lastTime = 0;
  private rafId = 0;
  private autosaveTimer = 0;
  private snapshotTimer = 0;
  private listeners = new Set<() => void>();
  private snapshot: GameSnapshot;

  constructor(save?: SaveData | null) {
    this.res = new ResourceManager(save?.resources);
    this.up = new UpgradeManager(save?.upgrades);
    this.factions = new FactionManager();
    this.waves = new WaveManager(this.factions);
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
      shipsOwned: emptyShipCounts(),
    };

    if (save) this.applySave(save);

    this.snapshot = this.buildSnapshot();
  }

  // ------------------------------------------------------------------ save
  private applySave(save: SaveData): void {
    this.waves.load(save.wave);
    this.autoAdvance = save.autoAdvance ?? true;
    this.autoRetry = save.autoRetry ?? false;
    this.targetWave = save.targetWave ?? 0;
    // Rebuild towers (with their per-tower upgrade levels)
    for (const t of save.towers ?? []) {
      this.towers.build(this.world, t.defId, t.slotIndex, t.levels);
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
      version: 3,
      resources: this.res.res,
      upgrades: this.up.levels,
      wave: this.waves.wave,
      islandHp: this.world.islandHp,
      autoAdvance: this.autoAdvance,
      autoRetry: this.autoRetry,
      targetWave: this.targetWave,
      towers: this.world.towers.map((t) => ({
        defId: t.defId,
        slotIndex: t.slotIndex,
        levels: { ...t.levels },
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

    // Throttle UI snapshots so React re-renders at a fixed cadence rather than
    // every animation frame. User actions still push an immediate snapshot.
    this.snapshotTimer += realDt;
    if (this.snapshotTimer >= SNAPSHOT_INTERVAL) {
      this.snapshotTimer = 0;
      this.snapshot = this.buildSnapshot();
      this.emit();
    }
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
      const auraMult = this.towers.damageAuraMult(w, tower);
      const dmg =
        def.damage *
        w.bonuses.towerDamageMult(tower.defId) *
        auraMult *
        this.towers.perTowerDamageMult(tower);
      this.projectiles.spawn(
        w,
        tower.pos,
        target.pos,
        dmg,
        def.splash,
        def.bossMultiplier,
        def.color,
        target.uid,
        def.projectileSpeed,
        { pierceCount: def.pierceCount, status: def.appliesStatus, fromTower: true }
      );
    });

    this.ships.update(w, dt, (ship, from, target) => {
      const def: ShipDef = SHIP_DEFS[ship.defId];
      const dmg = def.damage * w.bonuses.shipDamageMult;
      this.projectiles.spawn(
        w,
        from,
        target.pos,
        dmg,
        def.splash ?? 0,
        def.bossMultiplier ?? 1,
        def.color,
        target.uid,
        460,
        { status: def.appliesStatus, ignoreArmor: def.ignoreArmor }
      );
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

    // Enemy movement + core damage (also ticks status DoT/expiry)
    this.enemies.update(w, dt, this.res, goldScale);

    // Abilities cooldowns (player + dragon)
    this.abilities.update(dt);
    this.dragons.update(dt);

    // Effects decay
    for (const fx of w.effects) fx.life -= dt;
    w.effects = w.effects.filter((fx) => fx.life > 0);

    // DPS event pruning
    const cutoff = w.time - DPS_WINDOW;
    w.damageEvents = w.damageEvents.filter((d) => d.t >= cutoff);

    // Wave end → auto-advance + rewards (fires once per wave via betweenWaves)
    if (!this.waves.active && w.enemies.length === 0) {
      if (!this.betweenWaves) {
        this.betweenWaves = true;
        this.onWaveCleared();
      }
    }

    // Island destroyed
    if (w.islandHp <= 0 && !this.gameOver) {
      if (this.autoRetry) {
        this.retryCurrentWave();
      } else {
        this.gameOver = true;
        this.showBanner("The Tidehold Has Fallen", 9999);
      }
    }
  }

  /**
   * Soft-restart the current (highest reached) wave: keep towers, ships, and
   * upgrades, restore island HP, clear the battlefield, and re-run this wave.
   * Lets players farm their best wave for gold without losing progress.
   */
  private retryCurrentWave(): void {
    const w = this.world;
    const wave = Math.max(1, this.waves.wave);
    w.islandHp = w.maxIslandHp;
    w.enemies = [];
    w.projectiles = [];
    w.effects = [];
    this.betweenWaves = false;
    // Rewind to just before this wave so startWave() replays it.
    this.waves.load(wave - 1);
    this.showBanner(`Auto-Retry: Wave ${wave}`, 2.5);
    this.startWave();
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

    // Dragon Trust trickle for clearing a wave (no-op until the egg is claimed).
    this.dragons.onWaveCleared();

    // Dragon egg discovery
    if (this.dragons.checkEggDiscovery(this.waves.wave)) {
      this.eventToast = {
        title: "A Dragon Egg!",
        body: "Hidden in plundered cargo, you find a living dragon egg. Fog rolls in. Jasper Barrow's lantern flickers in the mist — the island is now part of something far larger. Claim the egg to begin the sanctuary.",
      };
    }

    // Auto-advance unless a target wave is set and already reached.
    const reachedTarget =
      this.targetWave > 0 && this.waves.wave >= this.targetWave;
    if (this.autoAdvance && !reachedTarget && !this.gameOver) {
      this.startWave();
    } else if (this.autoAdvance && reachedTarget && !this.gameOver) {
      // Auto-advance hit the stop wave: switch to Auto-Retry to keep farming it.
      if (!this.autoRetry) {
        this.autoRetry = true;
        this.showBanner(`Target Wave ${this.targetWave} — Auto-Retry On`, 3);
      }
      // Replay the target wave immediately.
      this.retryCurrentWave();
    }
  }

  // ------------------------------------------------------------- public API
  startWave(): void {
    if (this.gameOver || this.waves.active) return;
    this.waves.startNextWave();
    this.betweenWaves = false;
    const w = this.waves.wave;
    const faction = FACTION_DEFS[this.factions.factionForWave(w)];
    if (this.waves.isBossWave(w)) {
      const boss = ENEMY_DEFS[this.factions.bossForWave(w)];
      this.showBanner(`Wave ${w}: ${boss.name}`, 4);
    } else if (this.isBandStart(w)) {
      // First wave of a new faction band — announce the Pirate King.
      this.showBanner(`Wave ${w}: ${faction.name} Approaches`, 3.5);
    } else if (w % 10 === 0) {
      this.showBanner(`Wave ${w}: The Tide Rises`, 3);
    }
  }

  /** True on the first wave of a faction band (wave 1, bossEvery+1, ...). */
  private isBandStart(wave: number): boolean {
    return wave > 1 && (wave - 1) % WAVE.bossEvery === 0;
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
    if (this.armedDragonAbility) {
      const ok = this.castDragonAbility(this.armedDragonAbility, point);
      this.armedDragonAbility = null;
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

  toggleAutoRetry(): void {
    this.autoRetry = !this.autoRetry;
    this.pushSnapshot();
  }

  /** Set the wave at which auto-advance should stop (0 = endless). */
  setTargetWave(n: number): void {
    this.targetWave = Math.max(0, Math.floor(n));
    this.pushSnapshot();
  }

  /** True only when no wave is in progress (so stepping is safe). */
  canStepWave(): boolean {
    return !this.waves.active && !this.gameOver;
  }

  /** Advance to the next wave (between waves only). */
  nextWave(): void {
    if (!this.canStepWave()) return;
    this.startWave();
  }

  /** Step back one wave so the next start replays a lower wave (between waves). */
  prevWave(): void {
    if (!this.canStepWave()) return;
    const target = Math.max(0, this.waves.wave - 1);
    this.waves.load(target);
    this.pushSnapshot();
  }

  // --------------------------------------------------- per-tower upgrades
  /** Select (or deselect) a placed tower by its uid for the detail panel. */
  selectTower(uid: number | null): void {
    this.selectedTowerUid =
      uid !== null && this.selectedTowerUid === uid ? null : uid;
    this.pushSnapshot();
  }

  /** Nearest placed tower to a battlefield point (for click-to-select). */
  towerAt(point: Vec2) {
    return this.towers.towerAt(this.world, point);
  }

  /** Buy one upgrade level (dmg/range/rate) for the selected tower. */
  upgradeSelectedTower(kind: TowerUpgradeKind): boolean {
    if (this.selectedTowerUid === null) return false;
    const tower = this.towers.byUid(this.world, this.selectedTowerUid);
    if (!tower || this.towers.isMaxed(tower, kind)) return false;
    const cost = this.towers.upgradeCost(tower, kind);
    if (!this.res.spend(cost)) return false;
    this.towers.applyUpgrade(this.world, tower, kind);
    this.pushSnapshot();
    return true;
  }

  /**
   * Sell a placed tower, refunding 50% of its invested value (build cost plus
   * every per-tower upgrade paid), freeing its slot and clearing selection.
   */
  sellTower(uid: number): boolean {
    const tower = this.towers.byUid(this.world, uid);
    if (!tower) return false;
    const refund = this.towers.sellValue(tower);
    if (!this.towers.remove(this.world, uid)) return false;
    this.res.addMap(refund);
    if (this.selectedTowerUid === uid) this.selectedTowerUid = null;
    this.refreshDerived();
    this.pushSnapshot();
    return true;
  }

  claimEgg(): void {
    this.dragons.claimEgg();
    this.eventToast = null;
    this.refreshDerived();
    this.pushSnapshot();
  }

  // ------------------------------------------------------------- dragons
  /** Spend Trust to hatch a dragon; its passive aura applies immediately. */
  hatchDragon(id: DragonId): boolean {
    const ok = this.dragons.hatch(id);
    if (ok) {
      this.refreshDerived();
      this.pushSnapshot();
    }
    return ok;
  }

  /** Arm (or instantly cast) a dragon ability, mirroring `armAbility`. */
  armDragonAbility(id: DragonAbilityId): void {
    if (!this.dragons.abilityReady(id)) return;
    const def = DRAGON_ABILITY_DEFS[id];
    if (def.targeted) {
      this.armedDragonAbility = this.armedDragonAbility === id ? null : id;
      this.armedAbility = null; // only one armed action at a time
    } else {
      this.castDragonAbility(id);
    }
    this.pushSnapshot();
  }

  castDragonAbility(id: DragonAbilityId, target?: Vec2): boolean {
    return this.dragons.castAbility(id, {
      world: this.world,
      res: this.res,
      goldScale: this.waves.goldScale(),
      target,
    });
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
    // Bonuses changed → cached tower ranges may be stale.
    this.towers.recomputeRanges(this.world);
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
      autoRetry: this.autoRetry,
      targetWave: this.targetWave,
      canStepWave: this.canStepWave(),
      gameOver: this.gameOver,
      bossWave: this.waves.isBossWave(),
      activeFaction: this.factions.factionForWave(Math.max(1, this.waves.wave)),
      upgradeLevels: { ...this.up.levels },
      shipsOwned: { ...w.shipsOwned },
      towerCount: w.towers.length,
      selectedTower: this.selectedTowerInfo(),
      abilities: {
        barrage: { ...this.abilities.states.barrage },
        rally: { ...this.abilities.states.rally },
        broadside: { ...this.abilities.states.broadside },
        repairs: { ...this.abilities.states.repairs },
      },
      dragon: {
        ...this.dragons.state,
        hatched: [...this.dragons.state.hatched],
        abilityCooldowns: { ...this.dragons.state.abilityCooldowns },
      },
      armedAbility: this.armedAbility,
      armedDragonAbility: this.armedDragonAbility,
      bannerText: this.bannerText,
      eventToast: this.eventToast,
    };
  }

  /** Build the detail snapshot for the currently-selected tower, if any. */
  private selectedTowerInfo(): SelectedTowerInfo | null {
    if (this.selectedTowerUid === null) return null;
    const tower = this.towers.byUid(this.world, this.selectedTowerUid);
    if (!tower) return null;
    const def = TOWER_DEFS[tower.defId];
    const kind = (k: TowerUpgradeKind): SelectedTowerUpgrade => ({
      level: tower.levels[k],
      maxed: this.towers.isMaxed(tower, k),
      cost: this.towers.upgradeCost(tower, k),
    });

    // Live, effective combat stats (mirrors the firing math in step()).
    const support = def.damage <= 0 || def.fireInterval <= 0;
    const damage =
      def.damage *
      this.world.bonuses.towerDamageMult(tower.defId) *
      this.towers.damageAuraMult(this.world, tower) *
      this.towers.perTowerDamageMult(tower);
    const fireInterval = this.towers.effectiveFireInterval(this.world, tower);
    const fireRate = fireInterval > 0 ? 1 / fireInterval : 0;
    const stats = {
      damage,
      fireInterval,
      fireRate,
      range: this.towers.effectiveRange(this.world, tower),
      dps: support ? 0 : damage * fireRate,
      splash: def.splash,
      bossMultiplier: def.bossMultiplier,
      status: def.appliesStatus,
      support,
    };

    return {
      uid: tower.uid,
      defId: tower.defId,
      name: def.name,
      desc: def.desc,
      slotIndex: tower.slotIndex,
      stats,
      dmg: kind("dmg"),
      range: kind("range"),
      rate: kind("rate"),
      sellValue: this.towers.sellValue(tower),
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
    for (let i = 0; i < TOWER_SLOT_COUNT; i++) {
      out.push({ index: i, pos: this.towers.slotPos(i), occupied: occ.has(i) });
    }
    return out;
  }
}

/** Zeroed ownership counts for every defined ship, so new `ShipId`s are always
 *  present (save round-trips and snapshots never have missing keys). */
function emptyShipCounts(): Record<ShipId, number> {
  const out = {} as Record<ShipId, number>;
  for (const id of Object.keys(SHIP_DEFS) as ShipId[]) out[id] = 0;
  return out;
}
