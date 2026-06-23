// ============================================================================
// Computes derived combat/economy values from upgrade levels + dragon trust.
// Centralizing this keeps managers free of upgrade math.
// ============================================================================
import type { TowerId, UpgradeId, DragonState } from "./types";
import type { UpgradeManager } from "./managers/UpgradeManager";
import { UP, MAGIC_TOWER_IDS } from "./data/upgrades";
import { TOWER_DEFS } from "./data/towers";
import { SHIP_DEFS } from "./data/ships";
import {
  BASE_MAX_MANA,
  BASE_MANA_REGEN,
  DRAGON_TRUST_DAMAGE_BONUS,
} from "./config";

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
  /** Global tower damage bonus from dragon trust. */
  dragonDamageMult: number;
}

export function computeBonuses(up: UpgradeManager, dragon: DragonState): Bonuses {
  const dragonDamageMult = 1 + dragon.trust * DRAGON_TRUST_DAMAGE_BONUS;

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
    towerDamageMult: (id: TowerId) => {
      // Convention: each attacking tower has a `{id}Dmg` upgrade.
      let m = 1 + lvl(`${id}Dmg`) * mag(`${id}Dmg`);
      // Shared magic-damage upgrade applies on top for magic towers.
      if (isMagic(id)) m += lvl("magicDmg") * UP.magicDmg;
      return m * dragonDamageMult;
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
    shipDamageMult: 1 + up.level("shipDmg") * UP.shipDmg,
    shipRangeFlat: up.level("shipRange") * UP.shipRange,
    shipOrbitMult: 1 + up.level("shipOrbit") * UP.shipOrbit,
    shipReloadMult: 1 + up.level("shipReload") * UP.shipReload,
    maxMana: BASE_MAX_MANA + up.level("maxMana") * UP.maxMana,
    manaRegen: BASE_MANA_REGEN + up.level("manaRegen") * UP.manaRegen,
    goldMult: 1 + up.level("goldGain") * UP.goldGain,
  };
}

/** Ship base defs re-exported for convenience to managers. */
export { SHIP_DEFS };
