import type { Enemy, EnemyId } from "../types";
import type { World } from "../world";
import { ENEMY_DEFS } from "../data/enemies";
import { CENTER, ISLAND_RADIUS, SPAWN_RADIUS } from "../config";
import { dist, nextUid } from "../math";

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
      slowUntil: 0,
      slowFactor: 1,
      isBoss: def.isBoss,
    };
    world.enemies.push(enemy);
    return enemy;
  }

  /** Move enemies toward the core; resolve core hits. Returns core damage dealt. */
  update(world: World, dt: number): number {
    let coreDamage = 0;
    const survivors: Enemy[] = [];

    for (const e of world.enemies) {
      const def = ENEMY_DEFS[e.defId];
      const angle = Math.atan2(CENTER.y - e.pos.y, CENTER.x - e.pos.x);
      const slowed = world.time < e.slowUntil ? e.slowFactor : 1;
      const step = e.speed * slowed * dt;
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
