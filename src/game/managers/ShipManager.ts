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
      const target = this.pickTarget(world, from, range);
      if (!target) continue;

      fireProjectile(ship, from, target);
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
      const target = this.pickTarget(world, from, range);
      if (!target) continue;
      fireProjectile(ship, from, target);
      ship.cooldown = def.fireInterval;
      fired++;
    }
    return fired;
  }

  private pickTarget(world: World, from: Vec2, range: number): Enemy | null {
    let best: Enemy | null = null;
    let bestD = Infinity;
    for (const e of world.enemies) {
      const d = dist(from, e.pos);
      if (d > range) continue;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }
}
