import type { EnemyDef, EnemyId } from "../types";

export const ENEMY_DEFS: Record<EnemyId, EnemyDef> = {
  raider: {
    id: "raider",
    name: "Pirate Raider",
    baseHp: 18,
    speed: 38,
    armor: 0,
    damageToCore: 5,
    radius: 11,
    isBoss: false,
    reward: { gold: 4 },
    color: "#d65a5a",
  },
  skiff: {
    id: "skiff",
    name: "Landing Skiff",
    baseHp: 34,
    speed: 30,
    armor: 1,
    damageToCore: 8,
    radius: 14,
    isBoss: false,
    reward: { gold: 7, salvage: 1, powder: 1 },
    color: "#c77f3c",
  },
  brute: {
    id: "brute",
    name: "Armored Brute",
    baseHp: 90,
    speed: 20,
    armor: 4,
    damageToCore: 14,
    radius: 18,
    isBoss: false,
    reward: { gold: 14, salvage: 2 },
    color: "#9a8c7a",
  },
  captain: {
    id: "captain",
    name: "Egg-Runner Captain",
    baseHp: 400,
    speed: 24,
    armor: 6,
    damageToCore: 40,
    radius: 26,
    isBoss: true,
    reward: { gold: 120, salvage: 30, powder: 15 },
    color: "#d63d5e",
  },

  // ======================= Phase 5: Faction enemies =======================
  // Crimson Fleet — cheap, fast swarmers. Few HP each but they flood the field;
  // splash damage is the natural counter.
  crimsonSwarmer: {
    id: "crimsonSwarmer",
    name: "Crimson Swarmer",
    baseHp: 12,
    speed: 52,
    armor: 0,
    damageToCore: 4,
    radius: 9,
    isBoss: false,
    reward: { gold: 3 },
    color: "#ff5066",
    faction: "crimson",
  },
  crimsonReaver: {
    id: "crimsonReaver",
    name: "Crimson Reaver Lord",
    baseHp: 520,
    speed: 40,
    armor: 2,
    damageToCore: 36,
    radius: 24,
    isBoss: true,
    reward: { gold: 130, salvage: 28, powder: 14 },
    color: "#ff2e4d",
    faction: "crimson",
  },

  // Ironhull Armada — heavily armored. Armor-shred / pierce is the counter.
  ironhullBulwark: {
    id: "ironhullBulwark",
    name: "Ironhull Bulwark",
    baseHp: 70,
    speed: 16,
    armor: 10,
    damageToCore: 16,
    radius: 19,
    isBoss: false,
    reward: { gold: 12, salvage: 3 },
    color: "#7f8a99",
    faction: "ironhull",
  },
  ironhullDreadnought: {
    id: "ironhullDreadnought",
    name: "Ironhull Dreadnought",
    baseHp: 640,
    speed: 14,
    armor: 16,
    damageToCore: 50,
    radius: 30,
    isBoss: true,
    reward: { gold: 150, salvage: 40, powder: 16 },
    color: "#5f6b7a",
    faction: "ironhull",
  },

  // Stormcaller Covenant — very fast, fragile sky strikers. Slow / fire-rate
  // is the counter (Icey aura, frost towers).
  stormSkimmer: {
    id: "stormSkimmer",
    name: "Storm Skimmer",
    baseHp: 26,
    speed: 70,
    armor: 0,
    damageToCore: 7,
    radius: 11,
    isBoss: false,
    reward: { gold: 6, powder: 1 },
    color: "#7ad7ff",
    faction: "stormcallers",
  },
  stormHerald: {
    id: "stormHerald",
    name: "Stormcaller Herald",
    baseHp: 430,
    speed: 56,
    armor: 3,
    damageToCore: 34,
    radius: 23,
    isBoss: true,
    reward: { gold: 135, salvage: 26, powder: 18 },
    color: "#4fb8ff",
    faction: "stormcallers",
  },

  // Drowned Court — self-heal & heal-aura. Burst damage / burn DoT is the
  // counter (out-damage the regen).
  drownedMender: {
    id: "drownedMender",
    name: "Drowned Mender",
    baseHp: 110,
    speed: 22,
    armor: 2,
    damageToCore: 12,
    radius: 16,
    isBoss: false,
    reward: { gold: 13, salvage: 2 },
    color: "#3fae9a",
    faction: "drowned",
    regenPerSec: 6,
    healAuraPerSec: 5,
    healRadius: 90,
  },
  drownedLeviathan: {
    id: "drownedLeviathan",
    name: "Drowned Leviathan",
    baseHp: 560,
    speed: 20,
    armor: 5,
    damageToCore: 42,
    radius: 28,
    isBoss: true,
    reward: { gold: 140, salvage: 34, powder: 15 },
    color: "#2c8c7e",
    faction: "drowned",
    regenPerSec: 18,
  },

  // Goldhand Syndicate — bulky but reward-rich. No hard gimmick; greed bait.
  goldhandFactor: {
    id: "goldhandFactor",
    name: "Goldhand Factor",
    baseHp: 95,
    speed: 26,
    armor: 3,
    damageToCore: 15,
    radius: 17,
    isBoss: false,
    reward: { gold: 26, salvage: 3, powder: 2 },
    color: "#e8c14a",
    faction: "goldhand",
  },
  goldhandKingpin: {
    id: "goldhandKingpin",
    name: "Goldhand Kingpin",
    baseHp: 480,
    speed: 22,
    armor: 7,
    damageToCore: 38,
    radius: 27,
    isBoss: true,
    reward: { gold: 260, salvage: 48, powder: 24 },
    color: "#ffd24a",
    faction: "goldhand",
  },
};

/** Normal-wave enemy pool with weights; chosen per spawn. Scales by wave. */
export interface SpawnEntry {
  id: EnemyId;
  weight: number;
  minWave: number;
}

export const SPAWN_POOL: SpawnEntry[] = [
  { id: "raider", weight: 10, minWave: 1 },
  { id: "skiff", weight: 5, minWave: 3 },
  { id: "brute", weight: 3, minWave: 6 },
];
