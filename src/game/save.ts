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

/** Loosely-typed save during migration, before it is trusted as SaveData. */
type AnySave = Record<string, unknown> & { version?: number };

/**
 * Step-wise save migrations. Each entry upgrades a save of version `N` to
 * version `N + 1`. To add a new schema version: bump SAVE_VERSION in config,
 * then register a migration here keyed by the *old* version number.
 *
 * Example (when moving to v2):
 *   1: (old) => ({ ...old, version: 2, newField: defaultValue }),
 */
const MIGRATIONS: Record<number, (save: AnySave) => AnySave> = {
  // (no migrations yet — v1 is the initial schema)
};

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    let data = JSON.parse(raw) as AnySave;

    // Run forward migrations until the save reaches the current version.
    let guard = 0;
    while (typeof data.version === "number" && data.version < SAVE_VERSION) {
      const migrate = MIGRATIONS[data.version];
      if (!migrate || guard++ > 100) return null; // no path forward → discard
      data = migrate(data);
    }

    // Newer-than-current or unversioned saves are not understood.
    if (data.version !== SAVE_VERSION) return null;
    return data as unknown as SaveData;
  } catch {
    return null;
  }
}
