import type { UpgradeDef, UpgradeId } from "../types";

// Per-level effect magnitudes (used both for display and by bonuses.ts).
export const UP = {
  archerDmg: 0.15, // +15% archer dmg / level
  archerRange: 8, // +8 range / level
  cannonDmg: 0.18,
  cannonRange: 8,
  ballistaDmg: 0.2,
  ballistaRange: 10,
  watchtowerAura: 12, // +12 aura range / level
  shipDmg: 0.15,
  shipRange: 8,
  shipOrbit: 0.08, // +8% orbit speed / level
  shipReload: 0.06, // +6% fire rate / level
  maxMana: 25, // +25 max mana / level
  manaRegen: 1.2, // +1.2 mana/sec / level
  goldGain: 0.1, // +10% gold / level
};

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export const UPGRADE_DEFS: Record<UpgradeId, UpgradeDef> = {
  archerDmg: {
    id: "archerDmg",
    name: "Sharper Arrows",
    desc: "Increase Archer Nest damage.",
    baseCost: { gold: 60 },
    costScaling: 1.5,
    maxLevel: -1,
    effectLabel: (l) => `+${pct(l * UP.archerDmg)} dmg`,
  },
  archerRange: {
    id: "archerRange",
    name: "Longbow Range",
    desc: "Increase Archer Nest range.",
    baseCost: { gold: 50 },
    costScaling: 1.45,
    maxLevel: -1,
    effectLabel: (l) => `+${l * UP.archerRange} range`,
  },
  cannonDmg: {
    id: "cannonDmg",
    name: "Heated Shot",
    desc: "Increase Cannon Battery damage.",
    baseCost: { gold: 90, powder: 10 },
    costScaling: 1.55,
    maxLevel: -1,
    effectLabel: (l) => `+${pct(l * UP.cannonDmg)} dmg`,
  },
  cannonRange: {
    id: "cannonRange",
    name: "Long Barrels",
    desc: "Increase Cannon Battery range.",
    baseCost: { gold: 80 },
    costScaling: 1.45,
    maxLevel: -1,
    effectLabel: (l) => `+${l * UP.cannonRange} range`,
  },
  ballistaDmg: {
    id: "ballistaDmg",
    name: "Dragonbone Bolts",
    desc: "Increase Ballista damage.",
    baseCost: { gold: 120, salvage: 15 },
    costScaling: 1.6,
    maxLevel: -1,
    effectLabel: (l) => `+${pct(l * UP.ballistaDmg)} dmg`,
  },
  ballistaRange: {
    id: "ballistaRange",
    name: "Sky-Piercer Sights",
    desc: "Increase Ballista range.",
    baseCost: { gold: 100 },
    costScaling: 1.5,
    maxLevel: -1,
    effectLabel: (l) => `+${l * UP.ballistaRange} range`,
  },
  watchtowerAura: {
    id: "watchtowerAura",
    name: "Crow's Nest Network",
    desc: "Increase Watchtower range aura.",
    baseCost: { gold: 110 },
    costScaling: 1.55,
    maxLevel: -1,
    effectLabel: (l) => `+${l * UP.watchtowerAura} aura range`,
  },
  shipDmg: {
    id: "shipDmg",
    name: "Sharper Broadsides",
    desc: "Increase all ship damage.",
    baseCost: { gold: 90, salvage: 15 },
    costScaling: 1.55,
    maxLevel: -1,
    effectLabel: (l) => `+${pct(l * UP.shipDmg)} dmg`,
  },
  shipRange: {
    id: "shipRange",
    name: "Crow's Nest Spotters",
    desc: "Increase all ship attack range.",
    baseCost: { gold: 80, salvage: 10 },
    costScaling: 1.45,
    maxLevel: -1,
    effectLabel: (l) => `+${l * UP.shipRange} range`,
  },
  shipOrbit: {
    id: "shipOrbit",
    name: "Trimmed Sails",
    desc: "Increase ship orbit speed.",
    baseCost: { gold: 70, salvage: 10 },
    costScaling: 1.5,
    maxLevel: -1,
    effectLabel: (l) => `+${pct(l * UP.shipOrbit)} orbit speed`,
  },
  shipReload: {
    id: "shipReload",
    name: "Powder Monkeys",
    desc: "Increase ship reload (fire) speed.",
    baseCost: { gold: 85, powder: 8 },
    costScaling: 1.5,
    maxLevel: -1,
    effectLabel: (l) => `+${pct(l * UP.shipReload)} fire rate`,
  },
  maxMana: {
    id: "maxMana",
    name: "Mana Well",
    desc: "Increase maximum mana.",
    baseCost: { gold: 100 },
    costScaling: 1.5,
    maxLevel: -1,
    effectLabel: (l) => `+${l * UP.maxMana} max mana`,
  },
  manaRegen: {
    id: "manaRegen",
    name: "Tide Channeling",
    desc: "Increase mana regeneration.",
    baseCost: { gold: 110 },
    costScaling: 1.55,
    maxLevel: -1,
    effectLabel: (l) => `+${(l * UP.manaRegen).toFixed(1)} mana/s`,
  },
  goldGain: {
    id: "goldGain",
    name: "Plunder Tactics",
    desc: "Increase gold from all sources.",
    baseCost: { gold: 150 },
    costScaling: 1.7,
    maxLevel: -1,
    effectLabel: (l) => `+${pct(l * UP.goldGain)} gold`,
  },
};

export const UPGRADE_LIST: UpgradeId[] = Object.keys(UPGRADE_DEFS) as UpgradeId[];

// Grouping for UI tabs.
export const UPGRADE_GROUPS: { title: string; ids: UpgradeId[] }[] = [
  {
    title: "Towers",
    ids: [
      "archerDmg",
      "archerRange",
      "cannonDmg",
      "cannonRange",
      "ballistaDmg",
      "ballistaRange",
      "watchtowerAura",
    ],
  },
  {
    title: "Fleet",
    ids: ["shipDmg", "shipRange", "shipOrbit", "shipReload"],
  },
  {
    title: "Treasury & Magic",
    ids: ["goldGain", "maxMana", "manaRegen"],
  },
];
