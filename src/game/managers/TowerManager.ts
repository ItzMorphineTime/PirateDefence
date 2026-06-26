import type {
  Tower,
  TowerId,
  TowerLevels,
  TowerUpgradeKind,
  Enemy,
  Vec2,
  ResourceMap,
} from "../types";
import type { World } from "../world";
import { TOWER_DEFS } from "../data/towers";
import {
  TOWER_RING_RADIUS,
  TOWER_RING_INNER_RADIUS,
  TOWER_SLOT_COUNT,
  TOWER_SLOT_OUTER_COUNT,
  TOWER_SLOT_INNER_COUNT,
  TOWER_UPGRADE,
  CENTER,
} from "../config";
import { dist, nextUid, pointOnCircle } from "../math";

/** Fresh per-tower upgrade levels (all zero). */
export function defaultTowerLevels(): TowerLevels {
  return { dmg: 0, range: 0, rate: 0 };
}

export class TowerManager {
  /**
   * World-space position of a build slot. Flat indices `0..TOWER_SLOT_COUNT-1`
   * map onto two concentric rings: the first `TOWER_SLOT_OUTER_COUNT` indices
   * fill the outer ring, the remainder fill the inner ring (staggered).
   */
  slotPos(index: number): Vec2 {
    if (index < TOWER_SLOT_OUTER_COUNT) {
      const angle = (index / TOWER_SLOT_OUTER_COUNT) * Math.PI * 2 - Math.PI / 2;
      return pointOnCircle(CENTER, TOWER_RING_RADIUS, angle);
    }
    const innerIndex = index - TOWER_SLOT_OUTER_COUNT;
    const angle =
      (innerIndex / TOWER_SLOT_INNER_COUNT) * Math.PI * 2 -
      Math.PI / 2 +
      Math.PI / TOWER_SLOT_INNER_COUNT;
    return pointOnCircle(CENTER, TOWER_RING_INNER_RADIUS, angle);
  }

  occupiedSlots(world: World): Set<number> {
    return new Set(world.towers.map((t) => t.slotIndex));
  }

  build(
    world: World,
    defId: TowerId,
    slotIndex: number,
    levels: TowerLevels = defaultTowerLevels()
  ): Tower | null {
    if (slotIndex < 0 || slotIndex >= TOWER_SLOT_COUNT) return null;
    if (this.occupiedSlots(world).has(slotIndex)) return null;
    const tower: Tower = {
      uid: nextUid(),
      defId,
      pos: this.slotPos(slotIndex),
      slotIndex,
      cooldown: 0,
      cachedRange: 0,
      levels: { ...levels },
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

  /** Compute effective range including upgrades + watchtower auras + per-tower. */
  private computeRange(world: World, tower: Tower): number {
    const def = TOWER_DEFS[tower.defId];
    if (def.range <= 0) return 0;
    let range = def.range + world.bonuses.towerRangeFlat(tower.defId);
    // Per-tower range upgrades (flat).
    range += tower.levels.range * TOWER_UPGRADE.rangePerLevel;
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

  /** Per-tower damage multiplier from this tower's own `dmg` upgrade level. */
  perTowerDamageMult(tower: Tower): number {
    return 1 + tower.levels.dmg * TOWER_UPGRADE.dmgPerLevel;
  }

  /** Effective fire interval for a tower, reduced by its `rate` upgrade level. */
  effectiveFireInterval(tower: Tower): number {
    const base = TOWER_DEFS[tower.defId].fireInterval;
    const mult = Math.max(
      TOWER_UPGRADE.rateFloor,
      1 - tower.levels.rate * TOWER_UPGRADE.ratePerLevel
    );
    return base * mult;
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
      tower.cooldown = this.effectiveFireInterval(tower);
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

  // ----------------------------------------------------- per-tower upgrades
  byUid(world: World, uid: number): Tower | null {
    return world.towers.find((t) => t.uid === uid) ?? null;
  }

  /** Nearest tower to a world point within `tolerance` (virtual units). */
  towerAt(world: World, point: Vec2, tolerance = 20): Tower | null {
    let best: Tower | null = null;
    let bestD = tolerance;
    for (const t of world.towers) {
      const d = dist(t.pos, point);
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }

  /** True once a tower's upgrade kind has hit the max level. */
  isMaxed(tower: Tower, kind: TowerUpgradeKind): boolean {
    return tower.levels[kind] >= TOWER_UPGRADE.maxLevel;
  }

  /** Gold+salvage cost to buy the next level of `kind` for this tower. */
  upgradeCost(tower: Tower, kind: TowerUpgradeKind): Partial<ResourceMap> {
    const lvl = tower.levels[kind];
    const scale = Math.pow(TOWER_UPGRADE.costGrowth, lvl);
    return {
      gold: Math.round(TOWER_UPGRADE.costGoldBase * scale),
      salvage: Math.round(TOWER_UPGRADE.costSalvageBase * scale),
    };
  }

  /**
   * Apply one upgrade level of `kind` to a tower (caller has already spent the
   * cost). Recomputes ranges since dmg/range/rate may shift the cached value.
   */
  applyUpgrade(world: World, tower: Tower, kind: TowerUpgradeKind): void {
    tower.levels[kind]++;
    this.recomputeRanges(world);
  }
}
