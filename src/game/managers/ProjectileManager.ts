import type { Enemy, Projectile, Vec2 } from "../types";
import type { World } from "../world";
import { ENEMY_DEFS } from "../data/enemies";
import { dist, nextUid } from "../math";
import type { ResourceManager } from "./ResourceManager";

export interface KillResult {
  goldScale: number;
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
    speed: number
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
          this.damageEnemy(world, e, p, res, goldScale, onManaFromKill);
        }
      }
    } else {
      // Single-target: hit the originally targeted enemy if still present & near,
      // else nearest to impact point.
      let target = world.enemies.find((e) => e.uid === p.sourceTargetUid) ?? null;
      if (!target) {
        let bestD = Infinity;
        for (const e of world.enemies) {
          const d = dist(e.pos, p.target);
          if (d < bestD && d <= e_radius(e) + 14) {
            bestD = d;
            target = e;
          }
        }
      }
      if (target) this.damageEnemy(world, target, p, res, goldScale, onManaFromKill);
    }

    world.enemies = world.enemies.filter((e) => e.hp > 0);
  }

  private damageEnemy(
    world: World,
    e: Enemy,
    p: Projectile,
    res: ResourceManager,
    goldScale: number,
    onManaFromKill: (amount: number) => void
  ): void {
    if (e.hp <= 0) return;
    const def = ENEMY_DEFS[e.defId];
    let dmg = p.damage * (e.isBoss ? p.bossMultiplier : 1);
    dmg = Math.max(1, dmg - def.armor);
    e.hp -= dmg;
    world.damageEvents.push({ t: world.time, amount: dmg });

    if (e.hp <= 0) {
      // Reward: gold scaled by wave; other resources flat.
      const reward = { ...def.reward };
      const gold = (reward.gold ?? 0) * goldScale * world.bonuses.goldMult;
      res.add("gold", gold);
      if (reward.salvage) res.add("salvage", reward.salvage);
      if (reward.powder) res.add("powder", reward.powder);
      if (e.isBoss) {
        onManaFromKill(20);
        world.bossKills++;
      }
    }
  }
}

function e_radius(e: Enemy): number {
  return ENEMY_DEFS[e.defId].radius;
}
