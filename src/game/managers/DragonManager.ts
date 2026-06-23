import type { DragonState } from "../types";
import {
  DRAGON_EGG_WAVE,
  DRAGON_TRUST_PER_BOSS,
  DRAGON_EGG_BASE_TRUST,
} from "../config";

/**
 * MVP dragon hook. Structured so dragon types, hatch timers, sanctuary
 * upgrades, and dragon abilities can be layered on later.
 */
export class DragonManager {
  state: DragonState;

  constructor(initial?: Partial<DragonState>) {
    this.state = {
      eggDiscovered: false,
      eggClaimed: false,
      trust: 0,
      ...initial,
    };
  }

  /** Called when a wave is reached; returns true the moment the egg appears. */
  checkEggDiscovery(wave: number): boolean {
    if (!this.state.eggDiscovered && wave >= DRAGON_EGG_WAVE) {
      this.state.eggDiscovered = true;
      return true;
    }
    return false;
  }

  /** Player claims the egg → starts the sanctuary and grants base trust. */
  claimEgg(): void {
    if (this.state.eggDiscovered && !this.state.eggClaimed) {
      this.state.eggClaimed = true;
      this.state.trust += DRAGON_EGG_BASE_TRUST;
    }
  }

  /** Defending against bosses earns Dragon Trust. */
  onBossDefeated(): void {
    if (this.state.eggClaimed) {
      this.state.trust += DRAGON_TRUST_PER_BOSS;
    }
  }
}
