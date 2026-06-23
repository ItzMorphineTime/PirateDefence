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
