// ============================================================================
// Computes derived combat/economy values from upgrade levels + hatched dragon
// auras. Centralizing this keeps managers free of upgrade/aura math.
// ============================================================================
import type { TowerId, UpgradeId, DragonState } from "./types";
import type { UpgradeManager } from "./managers/UpgradeManager";
import type { CorruptionModifiers } from "./managers/CorruptionManager";
import { UP, MAGIC_TOWER_IDS, COUNTER_STATUS } from "./data/upgrades";
import { TOWER_DEFS } from "./data/towers";
import { SHIP_DEFS } from "./data/ships";
import { BASE_MAX_MANA, BASE_MANA_REGEN, DRAGON } from "./config";

export interface Bonuses {
  towerDamageMult: (id: TowerId) => number;
  towerRangeFlat: (id: TowerId) => number;
  watchtowerAura: number;
  shipDamageMult: number;
  shipRangeFlat: number;
  shipOrbitMult: number;
  shipReloadMult: number;
  maxMana: number;
  manaRegen: number;
  goldMult: number;
  /** Global tower damage multiplier from hatched dragons (Blaze / Elder). */
  dragonDamageMult: number;
  /** Global tower fire-rate multiplier from hatched dragons (Speedy / Elder). */
  towerFireRateMult: number;
  /** Global enemy speed multiplier from hatched dragons (Icey / Elder); ≤ 1. */
  enemySlowMult: number;
  /** Corruption-driven enemy speed multiplier (≥ 1); compounds with slow. */
  corruptionEnemySpeedMult: number;
  /** Corruption-driven enemy max-HP multiplier (≥ 1); applied at spawn. */
  corruptionEnemyHpMult: number;
  /** Flat armor shred applied by every tower hit (Armor-Piercing Munitions). */
  counterArmorShred: number;
  /** Slow factor (0..1) applied by every tower hit (Tidal Nets); 0 = none. */
  counterSlowFactor: number;
}

export function computeBonuses(
  up: UpgradeManager,
  dragon: DragonState,
  corruption: CorruptionModifiers
): Bonuses {
  // --- Dragon auras (hatched dragons each contribute; Elder adds a slice of all).
  const has = (id: string): boolean => dragon.hatched.includes(id as never);
  const elder = has("elder") ? DRAGON.elderAll : 0;
  const dragonDamageMult =
    1 + (has("blaze") ? DRAGON.blazeTowerDamage : 0) + elder;
  const towerFireRateMult =
    1 + (has("speedy") ? DRAGON.speedyFireRate : 0) + elder;
  const enemySlowMult = Math.max(
    DRAGON.enemySlowFloor,
    1 - (has("icey") ? DRAGON.iceyEnemySlow : 0) - elder
  );

  // --- Phase 5 faction counters (statuses applied by every tower hit).
  const counterArmorShred = up.level("armorPiercing") * UP.armorPiercing;
  const tidalLevel = up.level("tidalNets");
  const counterSlowFactor =
    tidalLevel > 0
      ? Math.max(COUNTER_STATUS.slowFloor, 1 - tidalLevel * UP.tidalNets)
      : 0;

  const isMagic = (id: TowerId): boolean =>
    (MAGIC_TOWER_IDS as readonly string[]).includes(id);

  /** Per-level magnitude for an upgrade id, or 0 if no such tunable exists. */
  const mag = (key: string): number =>
    (UP as Record<string, number>)[key] ?? 0;

  /** Level for an upgrade id that may not exist; 0 if the id is unknown. */
  const lvl = (key: string): number =>
    key in UP ? up.level(key as UpgradeId) : 0;

  return {
    dragonDamageMult,
    towerFireRateMult,
    enemySlowMult,
    corruptionEnemySpeedMult: corruption.enemySpeedMult,
    corruptionEnemyHpMult: corruption.enemyHpMult,
    counterArmorShred,
    counterSlowFactor,
    towerDamageMult: (id: TowerId) => {
      // Convention: each attacking tower has a `{id}Dmg` upgrade.
      let m = 1 + lvl(`${id}Dmg`) * mag(`${id}Dmg`);
      // Shared magic-damage upgrade applies on top for magic towers.
      if (isMagic(id)) m += lvl("magicDmg") * UP.magicDmg;
      // Dragon auras × forbidden Crown Shard corruption boost.
      return m * dragonDamageMult * corruption.damageMult;
    },
    towerRangeFlat: (id: TowerId) => {
      // Convention: each ranged tower has a `{id}Range` upgrade.
      let flat = lvl(`${id}Range`) * mag(`${id}Range`);
      if (isMagic(id)) flat += lvl("magicPotency") * UP.magicPotency;
      return flat;
    },
    watchtowerAura:
      (TOWER_DEFS.watchtower.rangeAura ?? 0) +
      up.level("watchtowerAura") * UP.watchtowerAura,
    shipDamageMult:
      (1 + up.level("shipDmg") * UP.shipDmg) * corruption.damageMult,
    shipRangeFlat: up.level("shipRange") * UP.shipRange,
    shipOrbitMult: 1 + up.level("shipOrbit") * UP.shipOrbit,
    shipReloadMult: 1 + up.level("shipReload") * UP.shipReload,
    maxMana: BASE_MAX_MANA + up.level("maxMana") * UP.maxMana,
    manaRegen: BASE_MANA_REGEN + up.level("manaRegen") * UP.manaRegen,
    goldMult: (1 + up.level("goldGain") * UP.goldGain) * corruption.goldMult,
  };
}

/** Ship base defs re-exported for convenience to managers. */
export { SHIP_DEFS };
