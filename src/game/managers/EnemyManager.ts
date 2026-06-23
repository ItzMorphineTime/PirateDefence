import type { Enemy, EnemyId } from "../types";
import type { World } from "../world";
import { ENEMY_DEFS } from "../data/enemies";
import { CENTER, ISLAND_RADIUS, SPAWN_RADIUS } from "../config";
import { dist, nextUid } from "../math";
import { applyDamage, moveFactor } from "../combat";
import type { ResourceManager } from "./ResourceManager";

export class EnemyManager {
  /** Spawn one enemy of the given def with a scaled HP value. */
  spawn(world: World, defId: EnemyId, hpScale: number): Enemy {
    const def = ENEMY_DEFS[defId];
    const angle = Math.random() * Math.PI * 2;
    const pos = {
      x: CENTER.x + Math.cos(angle) * SPAWN_RADIUS,
      y: CENTER.y + Math.sin(angle) * SPAWN_RADIUS,
    };
    const maxHp = def.baseHp * hpScale;
    const enemy: Enemy = {
      uid: nextUid(),
      defId,
      pos,
      hp: maxHp,
      maxHp,
      speed: def.speed,
      isBoss: def.isBoss,
      statuses: [],
    };
    world.enemies.push(enemy);
    return enemy;
  }

  /**
   * Tick statuses (burn DoT + expiry), move enemies toward the core, and
   * resolve core hits. Burn kills route through applyDamage for correct
   * rewards. Returns core damage dealt this tick.
   */
  update(world: World, dt: number, res: ResourceManager, goldScale: number): number {
    const now = world.time;

    // Status DoT + expiry (do this before movement so deaths are removed below).
    for (const e of world.enemies) {
      if (e.statuses.length === 0) continue;
      let burnDps = 0;
      for (const s of e.statuses) {
        if (s.until > now && s.id === "burn") burnDps += s.magnitude;
      }
      if (burnDps > 0 && e.hp > 0) {
        applyDamage(world, e, burnDps * dt, res, goldScale);
      }
      // Drop expired statuses.
      e.statuses = e.statuses.filter((s) => s.until > now);
    }

    let coreDamage = 0;
    const survivors: Enemy[] = [];

    for (const e of world.enemies) {
      if (e.hp <= 0) continue; // killed by burn this tick
      const def = ENEMY_DEFS[e.defId];
      const angle = Math.atan2(CENTER.y - e.pos.y, CENTER.x - e.pos.x);
      const factor = moveFactor(e, now);
      const step = e.speed * factor * dt;
      e.pos.x += Math.cos(angle) * step;
      e.pos.y += Math.sin(angle) * step;

      if (dist(e.pos, CENTER) <= ISLAND_RADIUS) {
        coreDamage += def.damageToCore;
        // enemy is consumed attacking the core
      } else {
        survivors.push(e);
      }
    }

    world.enemies = survivors;
    if (coreDamage > 0) {
      world.islandHp = Math.max(0, world.islandHp - coreDamage);
    }
    return coreDamage;
  }
}
