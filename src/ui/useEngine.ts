import { useSyncExternalStore } from "react";
import type { GameEngine } from "../game/GameEngine";
import type { GameSnapshot } from "../game/types";

/** Subscribe a component to the engine's throttled snapshot. */
export function useGameSnapshot(engine: GameEngine): GameSnapshot {
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot);
}
