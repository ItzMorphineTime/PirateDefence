// ============================================================================
// Computes derived combat/economy values from upgrade levels + dragon trust.
// Centralizing this keeps managers free of upgrade math.
// ============================================================================
import type { TowerId, DragonState } from "./types";
import type { UpgradeManager } from "./managers/UpgradeManager";
import { UP } from "./data/upgrades";
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

  return {
    dragonDamageMult,
    towerDamageMult: (id: TowerId) => {
      let m = 1;
      if (id === "archer") m = 1 + up.level("archerDmg") * UP.archerDmg;
      else if (id === "cannon") m = 1 + up.level("cannonDmg") * UP.cannonDmg;
      else if (id === "ballista") m = 1 + up.level("ballistaDmg") * UP.ballistaDmg;
      return m * dragonDamageMult;
    },
    towerRangeFlat: (id: TowerId) => {
      if (id === "archer") return up.level("archerRange") * UP.archerRange;
      if (id === "cannon") return up.level("cannonRange") * UP.cannonRange;
      if (id === "ballista") return up.level("ballistaRange") * UP.ballistaRange;
      return 0;
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
