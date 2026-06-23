import type { Tower, TowerId, Enemy, Vec2 } from "../types";
import type { World } from "../world";
import { TOWER_DEFS } from "../data/towers";
import { TOWER_RING_RADIUS, TOWER_SLOT_COUNT, CENTER } from "../config";
import { dist, nextUid, pointOnCircle } from "../math";

export class TowerManager {
  /** World-space position of a build slot. */
  slotPos(index: number): Vec2 {
    const angle = (index / TOWER_SLOT_COUNT) * Math.PI * 2 - Math.PI / 2;
    return pointOnCircle(CENTER, TOWER_RING_RADIUS, angle);
  }

  occupiedSlots(world: World): Set<number> {
    return new Set(world.towers.map((t) => t.slotIndex));
  }

  build(world: World, defId: TowerId, slotIndex: number): Tower | null {
    if (slotIndex < 0 || slotIndex >= TOWER_SLOT_COUNT) return null;
    if (this.occupiedSlots(world).has(slotIndex)) return null;
    const tower: Tower = {
      uid: nextUid(),
      defId,
      pos: this.slotPos(slotIndex),
      slotIndex,
      cooldown: 0,
      cachedRange: 0,
    };
    world.towers.push(tower);
    this.recomputeRanges(world);
    return tower;
  }

  /**
   * Recompute and cache every tower's effective range. Call when the tower
   * roster or bonuses change (build/remove/upgrade/dragon-trust), not per frame.
   */
  recomputeRanges(world: World): void {
    for (const tower of world.towers) {
      tower.cachedRange = this.computeRange(world, tower);
    }
  }

  /** Read the cached effective range (computed in recomputeRanges). */
  effectiveRange(_world: World, tower: Tower): number {
    return tower.cachedRange;
  }

  /** Compute effective range including upgrades + watchtower auras. */
  private computeRange(world: World, tower: Tower): number {
    const def = TOWER_DEFS[tower.defId];
    if (def.range <= 0) return 0;
    let range = def.range + world.bonuses.towerRangeFlat(tower.defId);
    // Apply watchtower auras
    for (const t of world.towers) {
      if (t.defId !== "watchtower" || t.uid === tower.uid) continue;
      const wDef = TOWER_DEFS.watchtower;
      if (dist(t.pos, tower.pos) <= (wDef.auraRadius ?? 0)) {
        range += world.bonuses.watchtowerAura;
      }
    }
    return range;
  }

  /** Tick all towers: target acquisition + firing (spawns projectiles). */
  update(world: World, dt: number, fireProjectile: (t: Tower, target: Enemy) => void): void {
    const attackMult = world.time < world.rallyUntil ? world.rallyMult : 1;

    for (const tower of world.towers) {
      const def = TOWER_DEFS[tower.defId];
      if (def.damage <= 0 || def.fireInterval <= 0) continue; // support tower

      tower.cooldown -= dt * attackMult;
      if (tower.cooldown > 0) continue;

      const range = this.effectiveRange(world, tower);
      const target = this.pickTarget(world, tower.pos, range, def.minRange ?? 0);
      if (!target) continue;

      fireProjectile(tower, target);
      tower.cooldown = def.fireInterval;
    }
  }

  /**
   * Prefer closest-to-core (lowest distance to center) within [minRange, range].
   * minRange lets long-range towers (mortar) ignore point-blank enemies.
   */
  private pickTarget(
    world: World,
    from: Vec2,
    range: number,
    minRange: number
  ): Enemy | null {
    let best: Enemy | null = null;
    let bestCoreDist = Infinity;
    for (const e of world.enemies) {
      const d = dist(from, e.pos);
      if (d > range || d < minRange) continue;
      const cd = dist(e.pos, CENTER);
      if (cd < bestCoreDist) {
        bestCoreDist = cd;
        best = e;
      }
    }
    return best;
  }

  /**
   * Combined damage multiplier from all Ember-Shrine damage auras whose radius
   * covers this tower. Returns 1 when no shrine is in range.
   */
  damageAuraMult(world: World, tower: Tower): number {
    let mult = 1;
    for (const t of world.towers) {
      const def = TOWER_DEFS[t.defId];
      if (!def.damageAura || t.uid === tower.uid) continue;
      if (dist(t.pos, tower.pos) <= (def.auraRadius ?? 0)) {
        mult += def.damageAura;
      }
    }
    return mult;
  }
}
