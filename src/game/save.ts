import type {
  DragonState,
  ResourceMap,
  ShipId,
  TowerId,
  UpgradeId,
} from "./types";
import { SAVE_KEY, SAVE_VERSION } from "./config";

export interface SaveData {
  version: number;
  resources: ResourceMap;
  upgrades: Record<UpgradeId, number>;
  wave: number;
  islandHp: number;
  autoAdvance: boolean;
  towers: { defId: TowerId; slotIndex: number }[];
  shipsOwned: Record<ShipId, number>;
  dragon: DragonState;
}

export function saveGame(data: SaveData | null): void {
  try {
    if (data === null) {
      localStorage.removeItem(SAVE_KEY);
      return;
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable; ignore.
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== SAVE_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}
