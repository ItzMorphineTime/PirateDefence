import type { AbilityId, AbilityState, Vec2 } from "../types";
import type { World } from "../world";
import { ABILITY_DEFS, ABILITY_LIST, ABILITY_TUNING } from "../data/abilities";
import { SHIP_DEFS } from "../data/ships";
import { CENTER } from "../config";
import { dist } from "../math";
import { applyDamage } from "../combat";
import type { ResourceManager } from "./ResourceManager";
import type { ShipManager } from "./ShipManager";
import type { ProjectileManager } from "./ProjectileManager";

export class AbilityManager {
  states: Record<AbilityId, AbilityState>;

  constructor() {
    this.states = {} as Record<AbilityId, AbilityState>;
    for (const id of ABILITY_LIST) this.states[id] = { cooldown: 0 };
  }

  ready(id: AbilityId): boolean {
    return this.states[id].cooldown <= 0;
  }

  update(dt: number): void {
    for (const id of ABILITY_LIST) {
      const s = this.states[id];
      if (s.cooldown > 0) s.cooldown = Math.max(0, s.cooldown - dt);
    }
  }

  /**
   * Attempt to cast an ability.
   * Returns true if cast succeeded.
   */
  cast(
    id: AbilityId,
    ctx: {
      world: World;
      res: ResourceManager;
      ships: ShipManager;
      projectiles: ProjectileManager;
      goldScale: number;
      target?: Vec2;
      onManaFromKill: (amt: number) => void;
    }
  ): boolean {
    const def = ABILITY_DEFS[id];
    if (!this.ready(id)) return false;
    if (def.targeted && !ctx.target) return false;
    if (!ctx.res.canAfford(def.cost)) return false;
    ctx.res.spend(def.cost);
    this.states[id].cooldown = def.cooldown;

    const { world } = ctx;
    switch (id) {
      case "barrage":
        this.castBarrage(ctx);
        break;
      case "rally":
        world.rallyUntil = world.time + ABILITY_TUNING.rallyDuration;
        world.rallyMult = ABILITY_TUNING.rallyAttackSpeedMult;
        world.effects.push({
          pos: { x: CENTER.x, y: CENTER.y },
          radius: 120,
          life: 0.6,
          maxLife: 0.6,
          color: "#f2c14e",
        });
        break;
      case "broadside":
        ctx.ships.forceFireAll(world, (ship, from, t) => {
          const shipDef = SHIP_DEFS[ship.defId];
          const dmg =
            shipDef.damage *
            world.bonuses.shipDamageMult *
            ABILITY_TUNING.broadsideDamageMult;
          // Honor each ship's own behavior (splash/status/armor-pierce) so the
          // volley reflects the actual fleet composition.
          ctx.projectiles.spawn(
            world,
            from,
            t.pos,
            dmg,
            Math.max(20, shipDef.splash ?? 0),
            shipDef.bossMultiplier ?? 1,
            "#e0883c",
            t.uid,
            500,
            { status: shipDef.appliesStatus, ignoreArmor: shipDef.ignoreArmor }
          );
        });
        break;
      case "repairs":
        world.islandHp = Math.min(
          world.maxIslandHp,
          world.islandHp + ABILITY_TUNING.repairsAmount
        );
        world.effects.push({
          pos: { x: CENTER.x, y: CENTER.y },
          radius: 80,
          life: 0.5,
          maxLife: 0.5,
          color: "#5ad17e",
        });
        break;
    }
    return true;
  }

  private castBarrage(ctx: {
    world: World;
    res: ResourceManager;
    projectiles: ProjectileManager;
    goldScale: number;
    target?: Vec2;
    onManaFromKill: (amt: number) => void;
  }): void {
    const { world, target } = ctx;
    if (!target) return;
    const radius = ABILITY_TUNING.barrageRadius;
    // Big explosion effect
    world.effects.push({
      pos: { x: target.x, y: target.y },
      radius,
      life: 0.5,
      maxLife: 0.5,
      color: "#e07a3c",
    });
    for (const e of world.enemies) {
      if (dist(e.pos, target) <= radius) {
        applyDamage(world, e, ABILITY_TUNING.barrageDamage, ctx.res, ctx.goldScale);
      }
    }
    world.enemies = world.enemies.filter((e) => e.hp > 0);
  }
}
