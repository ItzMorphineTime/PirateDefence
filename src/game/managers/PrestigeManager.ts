// ============================================================================
// PrestigeManager — owns persistent meta-progression ("Sanctuary Evacuation").
//
// Tideglass is a meta-currency banked when the player evacuates the sanctuary.
// It is milestone-gated (only runs past PRESTIGE.waveGate pay out) and grows
// with the square root of the distance past the gate (diminishing returns),
// plus a flat bonus per boss felled. Voluntary evacuation pays full value;
// being defeated pays only PRESTIGE.defeatFraction of it.
//
// Meta-upgrades bought with Tideglass grant permanent bonuses that apply to
// every future run. This manager persists itself under its OWN localStorage
// key (PRESTIGE.saveKey) so it survives the per-run save wipe on reset.
// ============================================================================
import type { MetaUpgradeId, PrestigeState } from "../types";
import { META, META_UPGRADE_DEFS, META_UPGRADE_LIST } from "../data/metaUpgrades";
import { PRESTIGE } from "../config";

/** Permanent run-start / global bonuses derived from meta-upgrade levels. */
export interface MetaModifiers {
  /** Permanent global tower & ship damage multiplier (≥ 1). */
  damageMult: number;
  /** Permanent global gold multiplier (≥ 1). */
  goldMult: number;
  /** Flat bonus to starting & maximum island HP. */
  islandHpFlat: number;
  /** Flat starting gold granted at run start. */
  startGold: number;
  /** Free levels added to each core damage upgrade line at run start. */
  headstartDamageLevels: number;
}

function emptyMeta(): Record<MetaUpgradeId, number> {
  const m = {} as Record<MetaUpgradeId, number>;
  for (const id of META_UPGRADE_LIST) m[id] = 0;
  return m;
}

export class PrestigeManager {
  state: PrestigeState;

  constructor(loaded?: PrestigeState | null) {
    this.state = {
      tideglass: loaded?.tideglass ?? 0,
      bestWave: loaded?.bestWave ?? 0,
      evacuations: loaded?.evacuations ?? 0,
      meta: { ...emptyMeta(), ...(loaded?.meta ?? {}) },
    };
  }

  level(id: MetaUpgradeId): number {
    return this.state.meta[id];
  }

  /** Tideglass cost of the next level of a meta-upgrade. */
  cost(id: MetaUpgradeId): number {
    const def = META_UPGRADE_DEFS[id];
    return Math.ceil(def.baseCost * Math.pow(def.costScaling, this.state.meta[id]));
  }

  isMaxed(id: MetaUpgradeId): boolean {
    const def = META_UPGRADE_DEFS[id];
    return def.maxLevel >= 0 && this.state.meta[id] >= def.maxLevel;
  }

  canAfford(id: MetaUpgradeId): boolean {
    return !this.isMaxed(id) && this.state.tideglass >= this.cost(id);
  }

  /** Spend Tideglass to buy one level. Returns true on success. */
  buy(id: MetaUpgradeId): boolean {
    if (!this.canAfford(id)) return false;
    this.state.tideglass -= this.cost(id);
    this.state.meta[id]++;
    return true;
  }

  /**
   * Tideglass earned by ending a run at `wave` having killed `bossKills` bosses.
   * Returns 0 below the wave gate. `defeated` runs pay a reduced fraction.
   */
  rewardFor(wave: number, bossKills: number, defeated: boolean): number {
    const past = wave - PRESTIGE.waveGate;
    if (past <= 0) return 0;
    const raw =
      Math.sqrt(past) * PRESTIGE.perWaveRootScale + bossKills * PRESTIGE.perBossKill;
    const scaled = defeated ? raw * PRESTIGE.defeatFraction : raw;
    return Math.floor(scaled);
  }

  /**
   * Bank the reward for an evacuation and update records. Returns the amount
   * actually granted (for UI feedback).
   */
  evacuate(wave: number, bossKills: number, defeated: boolean): number {
    const reward = this.rewardFor(wave, bossKills, defeated);
    this.state.tideglass += reward;
    this.state.evacuations++;
    if (wave > this.state.bestWave) this.state.bestWave = wave;
    return reward;
  }

  /** Derived permanent bonuses from current meta-upgrade levels. */
  modifiers(): MetaModifiers {
    const m = this.state.meta;
    return {
      damageMult: 1 + m.metaDamage * META.damageMult,
      goldMult: 1 + m.metaEconomy * META.economyGoldMult,
      islandHpFlat: m.metaFortitude * META.fortitudeHp,
      startGold: m.metaEconomy * META.economyStartGold,
      headstartDamageLevels: m.metaHeadstart * META.headstartUpgradeLevels,
    };
  }
}

/** Load persisted prestige state from its own localStorage key. */
export function loadPrestige(): PrestigeState | null {
  try {
    const raw = localStorage.getItem(PRESTIGE.saveKey);
    if (!raw) return null;
    const data = JSON.parse(raw) as { version?: number } & Partial<PrestigeState>;
    if (data.version !== PRESTIGE.saveVersion) return null;
    return {
      tideglass: typeof data.tideglass === "number" ? data.tideglass : 0,
      bestWave: typeof data.bestWave === "number" ? data.bestWave : 0,
      evacuations: typeof data.evacuations === "number" ? data.evacuations : 0,
      meta: { ...emptyMeta(), ...(data.meta ?? {}) },
    };
  } catch {
    return null;
  }
}

/** Persist prestige state under its own key (independent of the run save). */
export function savePrestige(state: PrestigeState): void {
  try {
    localStorage.setItem(
      PRESTIGE.saveKey,
      JSON.stringify({ version: PRESTIGE.saveVersion, ...state })
    );
  } catch {
    // localStorage unavailable; ignore.
  }
}
