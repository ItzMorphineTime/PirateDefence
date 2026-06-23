// ============================================================================
// Unified damage & status pipeline. Every source of enemy damage (towers,
// ships, abilities, status DoT) routes through applyDamage so that armor,
// armor-shred, rewards, mana-on-boss-kill, and bossKills counting live in one
// place. This keeps kill bookkeeping correct as new damage sources are added.
// ============================================================================
import type { Enemy, StatusId, StatusInstance } from "./types";
import type { World } from "./world";
import { ENEMY_DEFS } from "./data/enemies";
import type { ResourceManager } from "./managers/ResourceManager";

export interface DamageOptions {
  /** Multiplier applied only to boss enemies (e.g. ballista bonus). */
  bossMultiplier?: number;
  /** Mana granted to the player when this hit kills a boss. */
  manaOnBossKill?: number;
  /** Callback to grant mana from a boss kill (engine wires resource + clamp). */
  onManaFromKill?: (amount: number) => void;
}

/** Current effective armor for an enemy, reduced by any active armorShred. */
export function effectiveArmor(enemy: Enemy): number {
  const base = ENEMY_DEFS[enemy.defId].armor;
  let shred = 0;
  for (const s of enemy.statuses) {
    if (s.id === "armorShred") shred += s.magnitude;
  }
  return Math.max(0, base - shred);
}

/**
 * Apply `amount` raw damage to an enemy. Resolves armor, records the damage
 * event, and — if the hit is lethal — pays rewards and counts boss kills.
 * Returns true if the enemy died.
 */
export function applyDamage(
  world: World,
  enemy: Enemy,
  amount: number,
  res: ResourceManager,
  goldScale: number,
  opts: DamageOptions = {}
): boolean {
  if (enemy.hp <= 0) return false;
  const def = ENEMY_DEFS[enemy.defId];

  let dmg = amount * (enemy.isBoss ? opts.bossMultiplier ?? 1 : 1);
  dmg = Math.max(1, dmg - effectiveArmor(enemy));
  enemy.hp -= dmg;
  world.damageEvents.push({ t: world.time, amount: dmg });

  if (enemy.hp <= 0) {
    const gold = (def.reward.gold ?? 0) * goldScale * world.bonuses.goldMult;
    res.add("gold", gold);
    if (def.reward.salvage) res.add("salvage", def.reward.salvage);
    if (def.reward.powder) res.add("powder", def.reward.powder);
    if (enemy.isBoss) {
      world.bossKills++;
      if (opts.manaOnBossKill && opts.onManaFromKill) {
        opts.onManaFromKill(opts.manaOnBossKill);
      }
    }
    return true;
  }
  return false;
}

/**
 * Apply (or refresh) a status effect on an enemy. Re-applying an existing
 * status takes the later expiry and the stronger magnitude (armorShred stacks
 * additively up to a sane cap handled by effectiveArmor's clamp).
 */
export function applyStatus(
  enemy: Enemy,
  id: StatusId,
  durationSec: number,
  magnitude: number,
  now: number
): void {
  const until = now + durationSec;
  const existing = enemy.statuses.find((s) => s.id === id);
  if (existing) {
    existing.until = Math.max(existing.until, until);
    existing.magnitude = Math.max(existing.magnitude, magnitude);
    return;
  }
  const inst: StatusInstance = { id, until, magnitude };
  enemy.statuses.push(inst);
}

/** Current movement speed factor (1 = normal) from slow/stun statuses. */
export function moveFactor(enemy: Enemy, now: number): number {
  let factor = 1;
  for (const s of enemy.statuses) {
    if (s.until <= now) continue;
    if (s.id === "stun") return 0;
    if (s.id === "slow") factor = Math.min(factor, s.magnitude);
  }
  return factor;
}
