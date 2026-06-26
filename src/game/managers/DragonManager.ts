import type {
  DragonAbilityId,
  DragonId,
  DragonState,
  Vec2,
} from "../types";
import type { World } from "../world";
import {
  DRAGON_EGG_WAVE,
  DRAGON_TRUST_PER_BOSS,
  DRAGON_TRUST_PER_WAVE,
  DRAGON_EGG_BASE_TRUST,
  DRAGON_ABILITY_TUNING,
} from "../config";
import {
  DRAGON_DEFS,
  DRAGON_ABILITY_DEFS,
  DRAGON_ABILITY_LIST,
  DRAGON_ABILITY_OWNER,
} from "../data/dragons";
import { dist } from "../math";
import { applyDamage, applyStatus } from "../combat";
import type { ResourceManager } from "./ResourceManager";

/** Fresh, fully-initialized dragon state (no eggs, no dragons). */
function freshState(): DragonState {
  const abilityCooldowns = {} as Record<DragonAbilityId, number>;
  for (const id of DRAGON_ABILITY_LIST) abilityCooldowns[id] = 0;
  return {
    eggDiscovered: false,
    eggClaimed: false,
    trust: 0,
    hatched: [],
    abilityCooldowns,
  };
}

/**
 * Dragon sanctuary. Trust is a spendable currency earned from bosses/waves;
 * spending it hatches dragons whose passive auras are folded into
 * `computeBonuses`. Hatching Blaze also unlocks an active ability (Blaze
 * Breath) whose cooldown is ticked here and cast through `castAbility`.
 */
export class DragonManager {
  state: DragonState;

  constructor(initial?: Partial<DragonState>) {
    this.state = { ...freshState(), ...initial };
    // Backfill fields that older/partial saves may lack.
    if (!Array.isArray(this.state.hatched)) this.state.hatched = [];
    if (!this.state.abilityCooldowns) {
      this.state.abilityCooldowns = freshState().abilityCooldowns;
    } else {
      for (const id of DRAGON_ABILITY_LIST) {
        if (typeof this.state.abilityCooldowns[id] !== "number") {
          this.state.abilityCooldowns[id] = 0;
        }
      }
    }
  }

  /** Called when a wave is reached; returns true the moment the egg appears. */
  checkEggDiscovery(wave: number): boolean {
    if (!this.state.eggDiscovered && wave >= DRAGON_EGG_WAVE) {
      this.state.eggDiscovered = true;
      return true;
    }
    return false;
  }

  /** Player claims the egg → starts the sanctuary and grants base trust. */
  claimEgg(): void {
    if (this.state.eggDiscovered && !this.state.eggClaimed) {
      this.state.eggClaimed = true;
      this.state.trust += DRAGON_EGG_BASE_TRUST;
    }
  }

  /** Defending against bosses earns Dragon Trust. */
  onBossDefeated(): void {
    if (this.state.eggClaimed) {
      this.state.trust += DRAGON_TRUST_PER_BOSS;
    }
  }

  /** Clearing a wave earns a trickle of Trust once the sanctuary is active. */
  onWaveCleared(): void {
    if (this.state.eggClaimed) {
      this.state.trust += DRAGON_TRUST_PER_WAVE;
    }
  }

  // -------------------------------------------------------------- hatching
  isHatched(id: DragonId): boolean {
    return this.state.hatched.includes(id);
  }

  /** Can the player afford and legally hatch this dragon right now? */
  canHatch(id: DragonId): boolean {
    if (!this.state.eggClaimed || this.isHatched(id)) return false;
    return this.state.trust >= DRAGON_DEFS[id].hatchCost;
  }

  /** Spend Trust to hatch a dragon. Returns true on success. */
  hatch(id: DragonId): boolean {
    if (!this.canHatch(id)) return false;
    this.state.trust -= DRAGON_DEFS[id].hatchCost;
    this.state.hatched.push(id);
    return true;
  }

  // ----------------------------------------------------------- abilities
  /** Whether a dragon ability is unlocked (its owner dragon is hatched). */
  abilityUnlocked(id: DragonAbilityId): boolean {
    return this.isHatched(DRAGON_ABILITY_OWNER[id]);
  }

  abilityReady(id: DragonAbilityId): boolean {
    return this.abilityUnlocked(id) && this.state.abilityCooldowns[id] <= 0;
  }

  /** Tick down dragon-ability cooldowns. */
  update(dt: number): void {
    for (const id of DRAGON_ABILITY_LIST) {
      const cd = this.state.abilityCooldowns[id];
      if (cd > 0) this.state.abilityCooldowns[id] = Math.max(0, cd - dt);
    }
  }

  /**
   * Cast an active dragon ability. Mirrors AbilityManager.cast: checks unlock,
   * cooldown, and cost, spends, sets cooldown, then resolves the effect.
   */
  castAbility(
    id: DragonAbilityId,
    ctx: {
      world: World;
      res: ResourceManager;
      goldScale: number;
      target?: Vec2;
    }
  ): boolean {
    const def = DRAGON_ABILITY_DEFS[id];
    if (!this.abilityReady(id)) return false;
    if (def.targeted && !ctx.target) return false;
    if (!ctx.res.canAfford(def.cost)) return false;
    ctx.res.spend(def.cost);
    this.state.abilityCooldowns[id] = def.cooldown;

    switch (id) {
      case "blazeBreath":
        this.castBlazeBreath(ctx);
        break;
    }
    return true;
  }

  private castBlazeBreath(ctx: {
    world: World;
    res: ResourceManager;
    goldScale: number;
    target?: Vec2;
  }): void {
    const { world, target } = ctx;
    if (!target) return;
    const t = DRAGON_ABILITY_TUNING;
    world.effects.push({
      pos: { x: target.x, y: target.y },
      radius: t.blazeBreathRadius,
      life: 0.5,
      maxLife: 0.5,
      color: DRAGON_DEFS.blaze.color,
    });
    for (const e of world.enemies) {
      if (dist(e.pos, target) <= t.blazeBreathRadius) {
        applyDamage(world, e, t.blazeBreathDamage, ctx.res, ctx.goldScale);
        if (e.hp > 0) {
          applyStatus(
            e,
            "burn",
            t.blazeBreathBurnDuration,
            t.blazeBreathBurnDps,
            world.time
          );
        }
      }
    }
    world.enemies = world.enemies.filter((e) => e.hp > 0);
  }
}
