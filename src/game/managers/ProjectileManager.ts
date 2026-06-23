import type { Enemy, Projectile, StatusApplication, Vec2 } from "../types";
import type { World } from "../world";
import { ENEMY_DEFS } from "../data/enemies";
import { dist, nextUid } from "../math";
import { applyDamage, applyStatus } from "../combat";
import type { ResourceManager } from "./ResourceManager";

/** Optional per-shot behavior carried on a projectile (Phase 2 towers). */
export interface ProjectileOpts {
  pierceCount?: number;
  status?: StatusApplication;
}

export class ProjectileManager {
  spawn(
    world: World,
    from: Vec2,
    target: Vec2,
    damage: number,
    splash: number,
    bossMultiplier: number,
    color: string,
    targetUid: number,
    speed: number,
    opts: ProjectileOpts = {}
  ): void {
    const p: Projectile = {
      uid: nextUid(),
      pos: { x: from.x, y: from.y },
      target: { x: target.x, y: target.y },
      speed,
      damage,
      splash,
      bossMultiplier,
      color,
      sourceTargetUid: targetUid,
      pierceCount: opts.pierceCount,
      status: opts.status,
    };
    world.projectiles.push(p);
  }

  /** Move projectiles; resolve impacts. Returns gold earned (already scaled). */
  update(
    world: World,
    dt: number,
    res: ResourceManager,
    goldScale: number,
    onManaFromKill: (amount: number) => void
  ): void {
    const alive: Projectile[] = [];

    for (const p of world.projectiles) {
      const angle = Math.atan2(p.target.y - p.pos.y, p.target.x - p.pos.x);
      const step = p.speed * dt;
      const remaining = dist(p.pos, p.target);

      if (step >= remaining) {
        this.impact(world, p, res, goldScale, onManaFromKill);
        continue;
      }
      p.pos.x += Math.cos(angle) * step;
      p.pos.y += Math.sin(angle) * step;
      alive.push(p);
    }
    world.projectiles = alive;
  }

  private impact(
    world: World,
    p: Projectile,
    res: ResourceManager,
    goldScale: number,
    onManaFromKill: (amount: number) => void
  ): void {
    // Visual hit effect
    world.effects.push({
      pos: { x: p.target.x, y: p.target.y },
      radius: p.splash > 0 ? p.splash : 8,
      life: 0.25,
      maxLife: 0.25,
      color: p.color,
    });

    if (p.splash > 0) {
      for (const e of world.enemies) {
        if (dist(e.pos, p.target) <= p.splash) {
          this.hit(world, e, p, res, goldScale, onManaFromKill);
        }
      }
    } else {
      // Single-target (optionally piercing): start from the originally targeted
      // enemy, then the next-nearest enemies to the impact point.
      const pierce = Math.max(1, p.pierceCount ?? 1);
      const targets = this.pickPierceTargets(world, p, pierce);
      for (const t of targets) {
        this.hit(world, t, p, res, goldScale, onManaFromKill);
      }
    }

    world.enemies = world.enemies.filter((e) => e.hp > 0);
  }

  /**
   * Choose up to `count` enemies for a single-target/piercing shot: the aimed
   * enemy (if still alive & near) plus the nearest others to the impact point.
   */
  private pickPierceTargets(world: World, p: Projectile, count: number): Enemy[] {
    const out: Enemy[] = [];
    const primary = world.enemies.find((e) => e.uid === p.sourceTargetUid) ?? null;
    if (primary) out.push(primary);

    if (out.length < count) {
      const rest = world.enemies
        .filter((e) => e !== primary && dist(e.pos, p.target) <= e_radius(e) + 14)
        .sort((a, b) => dist(a.pos, p.target) - dist(b.pos, p.target));
      for (const e of rest) {
        if (out.length >= count) break;
        out.push(e);
      }
    }

    // Fallback: if nothing was aimed/near, hit the single closest enemy.
    if (out.length === 0) {
      let best: Enemy | null = null;
      let bestD = Infinity;
      for (const e of world.enemies) {
        const d = dist(e.pos, p.target);
        if (d < bestD && d <= e_radius(e) + 14) {
          bestD = d;
          best = e;
        }
      }
      if (best) out.push(best);
    }
    return out;
  }

  private hit(
    world: World,
    e: Enemy,
    p: Projectile,
    res: ResourceManager,
    goldScale: number,
    onManaFromKill: (amount: number) => void
  ): void {
    applyDamage(world, e, p.damage, res, goldScale, {
      bossMultiplier: p.bossMultiplier,
      manaOnBossKill: 20,
      onManaFromKill,
    });
    if (p.status && e.hp > 0) {
      applyStatus(e, p.status.id, p.status.duration, p.status.magnitude, world.time);
    }
  }
}

function e_radius(e: Enemy): number {
  return ENEMY_DEFS[e.defId].radius;
}
