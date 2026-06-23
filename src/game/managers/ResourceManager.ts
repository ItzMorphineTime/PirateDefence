import type { ResourceId, ResourceMap } from "../types";
import { START_RESOURCES } from "../config";

export class ResourceManager {
  res: ResourceMap;

  constructor(initial?: Partial<ResourceMap>) {
    this.res = { ...START_RESOURCES, ...initial };
  }

  get(id: ResourceId): number {
    return this.res[id];
  }

  add(id: ResourceId, amount: number): void {
    this.res[id] += amount;
  }

  addMap(map: Partial<ResourceMap>, multiplier = 1): void {
    for (const k in map) {
      const id = k as ResourceId;
      this.res[id] += (map[id] ?? 0) * multiplier;
    }
  }

  canAfford(cost: Partial<ResourceMap>): boolean {
    for (const k in cost) {
      const id = k as ResourceId;
      if (this.res[id] < (cost[id] ?? 0)) return false;
    }
    return true;
  }

  /** Spend if affordable. Returns true on success. */
  spend(cost: Partial<ResourceMap>): boolean {
    if (!this.canAfford(cost)) return false;
    for (const k in cost) {
      const id = k as ResourceId;
      this.res[id] -= cost[id] ?? 0;
    }
    return true;
  }

  clampMana(maxMana: number): void {
    if (this.res.mana > maxMana) this.res.mana = maxMana;
  }
}
