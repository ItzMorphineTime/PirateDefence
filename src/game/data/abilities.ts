import type { AbilityDef, AbilityId } from "../types";

export const ABILITY_DEFS: Record<AbilityId, AbilityDef> = {
  barrage: {
    id: "barrage",
    name: "Cannon Barrage",
    desc: "Bombard a chosen area for heavy splash damage.",
    cost: { mana: 30, powder: 10 },
    cooldown: 8,
    targeted: true,
  },
  rally: {
    id: "rally",
    name: "Rally the Crew",
    desc: "Boost tower & ship attack speed for 8s.",
    cost: { mana: 40 },
    cooldown: 18,
    targeted: false,
  },
  broadside: {
    id: "broadside",
    name: "Full Broadside",
    desc: "All ships fire instantly at heavy damage.",
    cost: { mana: 35, powder: 8 },
    cooldown: 12,
    targeted: false,
  },
  repairs: {
    id: "repairs",
    name: "Emergency Repairs",
    desc: "Restore a chunk of island HP.",
    cost: { mana: 30, salvage: 15 },
    cooldown: 15,
    targeted: false,
  },
  crownShard: {
    id: "crownShard",
    name: "Crown Shard",
    desc: "Forbidden power: devastate an area and mint gold — but raise corruption.",
    cost: { mana: 50, powder: 20 },
    cooldown: 16,
    targeted: true,
  },
};

export const ABILITY_LIST: AbilityId[] = [
  "barrage",
  "rally",
  "broadside",
  "repairs",
  "crownShard",
];

// Tunable ability effect values.
export const ABILITY_TUNING = {
  barrageDamage: 80,
  barrageRadius: 90,
  rallyDuration: 8,
  rallyAttackSpeedMult: 1.6,
  broadsideDamageMult: 3,
  repairsAmount: 35,
};
