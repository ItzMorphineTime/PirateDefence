// ============================================================================
// World: the shared mutable simulation state that managers read/write.
// The GameEngine owns the World and the managers; managers receive it per-tick.
// ============================================================================
import type {
  Enemy,
  Tower,
  Ship,
  Projectile,
  Effect,
  ShipId,
} from "./types";
import type { Bonuses } from "./bonuses";

export interface World {
  enemies: Enemy[];
  towers: Tower[];
  ships: Ship[];
  projectiles: Projectile[];
  effects: Effect[];

  islandHp: number;
  maxIslandHp: number;

  /** Recomputed each tick from upgrades + dragon trust. */
  bonuses: Bonuses;

  /** Rally buff: timestamp (game seconds) until which attack speed is boosted. */
  rallyUntil: number;
  rallyMult: number;

  /** Running game time in seconds (scaled by speed). */
  time: number;

  /** Damage dealt this frame, for DPS tracking. */
  damageEvents: { t: number; amount: number }[];

  /** Boss enemies actually killed (drained by the engine for Dragon Trust). */
  bossKills: number;

  shipsOwned: Record<ShipId, number>;

  /** Current Crown Shard corruption (0..CORRUPTION.max); drives the sea tint
   *  and threat/power modifiers. Mirrors CorruptionManager.level each tick. */
  corruption: number;
}
