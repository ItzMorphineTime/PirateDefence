import type {
  DragonAbilityDef,
  DragonAbilityId,
  DragonDef,
  DragonId,
} from "../types";
import { DRAGON } from "../config";

/**
 * The four hatchable dragons. Each is claimed by spending Dragon Trust (the
 * sanctuary currency) and then grants a permanent passive aura. Blaze also
 * unlocks an active ability (Blaze Breath). New dragons are pure data: add an
 * id to `DragonId`, an entry here, and it auto-appears in the sanctuary roster.
 */
export const DRAGON_DEFS: Record<DragonId, DragonDef> = {
  blaze: {
    id: "blaze",
    name: "Blaze",
    desc: "A furnace-hearted wyrm. Towers burn hotter.",
    color: "#ff7a3c",
    hatchCost: DRAGON.blazeHatchCost,
    aura: "towerDamage",
    auraMagnitude: DRAGON.blazeTowerDamage,
    ability: "blazeBreath",
  },
  icey: {
    id: "icey",
    name: "Icey",
    desc: "A frostscale that chills the tide. Enemies crawl.",
    color: "#6cc8ff",
    hatchCost: DRAGON.iceyHatchCost,
    aura: "enemySlow",
    auraMagnitude: DRAGON.iceyEnemySlow,
  },
  speedy: {
    id: "speedy",
    name: "Speedy",
    desc: "A darting skywing. Towers reload faster.",
    color: "#a6f06a",
    hatchCost: DRAGON.speedyHatchCost,
    aura: "fireRate",
    auraMagnitude: DRAGON.speedyFireRate,
  },
  elder: {
    id: "elder",
    name: "Elder Wyrm",
    desc: "The ancient guardian. A measure of every gift.",
    color: "#d9a8ff",
    hatchCost: DRAGON.elderHatchCost,
    aura: "all",
    auraMagnitude: DRAGON.elderAll,
  },
};

export const DRAGON_LIST: DragonId[] = Object.keys(DRAGON_DEFS) as DragonId[];

/** Active dragon abilities (only Blaze Breath for now). */
export const DRAGON_ABILITY_DEFS: Record<DragonAbilityId, DragonAbilityDef> = {
  blazeBreath: {
    id: "blazeBreath",
    name: "Blaze Breath",
    desc: "Blaze scorches a chosen area, dealing heavy damage and igniting all caught in it.",
    cost: { mana: 45, powder: 12 },
    cooldown: 16,
    targeted: true,
  },
};

export const DRAGON_ABILITY_LIST: DragonAbilityId[] = Object.keys(
  DRAGON_ABILITY_DEFS
) as DragonAbilityId[];

/** Which dragon must be hatched for a given ability to be usable. */
export const DRAGON_ABILITY_OWNER: Record<DragonAbilityId, DragonId> = {
  blazeBreath: "blaze",
};
