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

    // Faction healing (Drowned Court): self-regen + heal auras restore HP to
    // living enemies, applied before burn DoT so burn must out-pace the regen.
    this.applyHealing(world, dt);

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
      // Per-enemy status slow × Icey/Elder slow aura × Crown Shard corruption
      // speed-up (corruption makes the tide faster as well as tougher).
      const factor =
        moveFactor(e, now) *
        world.bonuses.enemySlowMult *
        world.bonuses.corruptionEnemySpeedMult;
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

  /**
   * Drowned Court healing: each living enemy regenerates `regenPerSec`, and
   * any healer with a `healAuraPerSec` mends allies within `healRadius`. HP is
   * clamped to maxHp so heals never overshoot. Cheap O(n×healers) loop — only
   * a handful of menders are ever on the field.
   */
  private applyHealing(world: World, dt: number): void {
    const healers: Enemy[] = [];
    for (const e of world.enemies) {
      if (e.hp <= 0) continue;
      const def = ENEMY_DEFS[e.defId];
      if (def.regenPerSec) {
        e.hp = Math.min(e.maxHp, e.hp + def.regenPerSec * dt);
      }
      if (def.healAuraPerSec && def.healRadius) healers.push(e);
    }
    if (healers.length === 0) return;
    for (const h of healers) {
      const def = ENEMY_DEFS[h.defId];
      const rate = def.healAuraPerSec!;
      const r2 = def.healRadius! * def.healRadius!;
      for (const e of world.enemies) {
        if (e === h || e.hp <= 0 || e.hp >= e.maxHp) continue;
        const dx = e.pos.x - h.pos.x;
        const dy = e.pos.y - h.pos.y;
        if (dx * dx + dy * dy <= r2) {
          e.hp = Math.min(e.maxHp, e.hp + rate * dt);
        }
      }
    }
  }
}
