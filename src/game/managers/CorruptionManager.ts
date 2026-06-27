// ============================================================================
// CorruptionManager — owns the 0..max corruption meter (Phase 6). Corruption is
// raised by wielding the forbidden Crown Shard and decays slowly when idle.
// It exposes derived modifiers (offense/economy up, enemy threat up) that the
// engine folds into `computeBonuses` and enemy HP/speed scaling, so corruption
// changes both power and threat measurably from one place.
// ============================================================================
import { CORRUPTION } from "../config";

/** Derived per-tick corruption effects, computed from the current meter. */
export interface CorruptionModifiers {
  /** Multiplier on tower & ship damage (≥ 1). */
  damageMult: number;
  /** Multiplier on gold rewards (≥ 1). */
  goldMult: number;
  /** Multiplier on enemy max HP (≥ 1). */
  enemyHpMult: number;
  /** Multiplier on enemy movement speed (≥ 1). */
  enemySpeedMult: number;
}

export class CorruptionManager {
  /** Current corruption (0..CORRUPTION.max). */
  level: number;

  constructor(initial = 0) {
    this.level = clampLevel(initial);
  }

  /** Fraction of the meter currently filled (0..1). */
  fraction(): number {
    return CORRUPTION.max > 0 ? this.level / CORRUPTION.max : 0;
  }

  /** Raise corruption (e.g. on a Crown Shard cast), clamped to the cap. */
  raise(amount: number): void {
    this.level = clampLevel(this.level + amount);
  }

  /** Passive decay toward 0 while corruption is not being actively raised. */
  update(dt: number): void {
    if (this.level > 0) {
      this.level = Math.max(0, this.level - CORRUPTION.decayPerSec * dt);
    }
  }

  /** Derived modifiers for the current meter (offense/economy + enemy threat). */
  modifiers(): CorruptionModifiers {
    const f = this.fraction();
    return {
      damageMult: 1 + CORRUPTION.damageBonusAtMax * f,
      goldMult: 1 + CORRUPTION.goldBonusAtMax * f,
      enemyHpMult: 1 + CORRUPTION.enemyHpAtMax * f,
      enemySpeedMult: 1 + CORRUPTION.enemySpeedAtMax * f,
    };
  }
}

function clampLevel(v: number): number {
  return v < 0 ? 0 : v > CORRUPTION.max ? CORRUPTION.max : v;
}
