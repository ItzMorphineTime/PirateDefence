import type { Ship, ShipId, Enemy, Vec2 } from "../types";
import type { World } from "../world";
import { SHIP_DEFS } from "../data/ships";
import { ORBIT_RADII, CENTER } from "../config";
import { dist, nextUid, pointOnCircle } from "../math";

export class ShipManager {
  add(world: World, defId: ShipId): Ship {
    const ship: Ship = {
      uid: nextUid(),
      defId,
      angle: Math.random() * Math.PI * 2,
      cooldown: 0,
    };
    world.ships.push(ship);
    world.shipsOwned[defId] = (world.shipsOwned[defId] ?? 0) + 1;
    return ship;
  }

  /**
   * Summon a temporary ship (e.g. Jasper's Ghost War Frigate) that fights for
   * `lifeSec` seconds and then vanishes. Summons are NOT counted in
   * `shipsOwned` — they're transient and never part of the recruited fleet.
   */
  addTemporary(world: World, defId: ShipId, lifeSec: number): Ship {
    const ship: Ship = {
      uid: nextUid(),
      defId,
      angle: Math.random() * Math.PI * 2,
      cooldown: 0,
      expiresAt: world.time + lifeSec,
    };
    world.ships.push(ship);
    return ship;
  }

  pos(ship: Ship): Vec2 {
    const def = SHIP_DEFS[ship.defId];
    return pointOnCircle(CENTER, ORBIT_RADII[def.ring], ship.angle);
  }

  effectiveRange(world: World, ship: Ship): number {
    return SHIP_DEFS[ship.defId].range + world.bonuses.shipRangeFlat;
  }

  /** Tick ships: orbit, repair, target + fire. */
  update(
    world: World,
    dt: number,
    fireProjectile: (ship: Ship, from: Vec2, target: Enemy) => void
  ): void {
    // Expire summoned ships (Ghost War Frigate) whose lifetime has elapsed.
    if (world.ships.some((s) => s.expiresAt != null && world.time >= s.expiresAt)) {
      world.ships = world.ships.filter(
        (s) => s.expiresAt == null || world.time < s.expiresAt
      );
    }

    const attackMult = world.time < world.rallyUntil ? world.rallyMult : 1;
    const orbitMult = world.bonuses.shipOrbitMult * (world.time < world.rallyUntil ? 1.1 : 1);
    const reloadMult = world.bonuses.shipReloadMult * attackMult;

    for (const ship of world.ships) {
      const def = SHIP_DEFS[ship.defId];
      ship.angle += def.orbitSpeed * orbitMult * dt;
      if (ship.angle > Math.PI * 2) ship.angle -= Math.PI * 2;

      const from = this.pos(ship);

      // Repair sloop heals the island over time
      if (def.repairRate && world.islandHp < world.maxIslandHp) {
        world.islandHp = Math.min(
          world.maxIslandHp,
          world.islandHp + def.repairRate * dt
        );
      }

      if (def.damage <= 0 || def.fireInterval <= 0) continue;

      ship.cooldown -= dt * reloadMult;
      if (ship.cooldown > 0) continue;

      const range = this.effectiveRange(world, ship);
      const targets = this.pickTargets(world, from, range, def.volley ?? 1);
      if (targets.length === 0) continue;

      for (const target of targets) fireProjectile(ship, from, target);
      ship.cooldown = def.fireInterval;
    }
  }

  /** Fire every ship immediately at a valid target (Full Broadside ability). */
  forceFireAll(
    world: World,
    fireProjectile: (ship: Ship, from: Vec2, target: Enemy) => void
  ): number {
    let fired = 0;
    for (const ship of world.ships) {
      const def = SHIP_DEFS[ship.defId];
      if (def.damage <= 0) continue;
      const from = this.pos(ship);
      const range = this.effectiveRange(world, ship);
      const targets = this.pickTargets(world, from, range, def.volley ?? 1);
      if (targets.length === 0) continue;
      for (const target of targets) fireProjectile(ship, from, target);
      ship.cooldown = def.fireInterval;
      fired++;
    }
    return fired;
  }

  /**
   * Pick up to `count` distinct in-range enemies, nearest first. With count = 1
   * this is the classic single-target pick; >1 powers volley ships (Man-o'-War).
   */
  private pickTargets(world: World, from: Vec2, range: number, count: number): Enemy[] {
    const inRange = world.enemies
      .filter((e) => dist(from, e.pos) <= range)
      .sort((a, b) => dist(from, a.pos) - dist(from, b.pos));
    return inRange.slice(0, Math.max(1, count));
  }
}
