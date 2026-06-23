import type { ResourceMap, UpgradeId } from "../types";
import { UPGRADE_DEFS, UPGRADE_LIST } from "../data/upgrades";
import type { ResourceManager } from "./ResourceManager";

export class UpgradeManager {
  levels: Record<UpgradeId, number>;

  constructor(initial?: Partial<Record<UpgradeId, number>>) {
    this.levels = {} as Record<UpgradeId, number>;
    for (const id of UPGRADE_LIST) {
      this.levels[id] = initial?.[id] ?? 0;
    }
  }

  level(id: UpgradeId): number {
    return this.levels[id];
  }

  /** Cost to buy the next level (scales geometrically per level). */
  cost(id: UpgradeId): Partial<ResourceMap> {
    const def = UPGRADE_DEFS[id];
    const lvl = this.levels[id];
    const mult = Math.pow(def.costScaling, lvl);
    const out: Partial<ResourceMap> = {};
    for (const k in def.baseCost) {
      const rk = k as keyof ResourceMap;
      out[rk] = Math.ceil((def.baseCost[rk] ?? 0) * mult);
    }
    return out;
  }

  isMaxed(id: UpgradeId): boolean {
    const def = UPGRADE_DEFS[id];
    return def.maxLevel >= 0 && this.levels[id] >= def.maxLevel;
  }

  /** Attempt to buy one level. Returns true on success. */
  buy(id: UpgradeId, res: ResourceManager): boolean {
    if (this.isMaxed(id)) return false;
    const cost = this.cost(id);
    if (!res.spend(cost)) return false;
    this.levels[id]++;
    return true;
  }
}
