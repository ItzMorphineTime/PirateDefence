import type { FactionDef, FactionId } from "../types";
import type { SpawnEntry } from "../data/enemies";
import { WAVE } from "../config";
import { FACTION_DEFS, FACTION_ORDER } from "../data/factions";

/**
 * FactionManager resolves which Pirate King faction governs a given wave.
 *
 * Selection model (resolved Phase 5 open decision): **rotating by wave band**.
 * Each block of `WAVE.bossEvery` waves is themed by one faction, cycling
 * through `FACTION_ORDER`. This means a band always culminates in that
 * faction's boss wave, giving a faction a clear "campaign" before the next
 * Pirate King takes over.
 *
 * The manager is stateless beyond the wave number it is asked about, so it
 * needs no save data — the active faction is derived from `WaveManager.wave`.
 */
export class FactionManager {
  /** Which faction owns the band that `wave` falls in. */
  factionForWave(wave: number): FactionId {
    const band = Math.floor(Math.max(0, wave - 1) / WAVE.bossEvery);
    return FACTION_ORDER[band % FACTION_ORDER.length];
  }

  defForWave(wave: number): FactionDef {
    return FACTION_DEFS[this.factionForWave(wave)];
  }

  /** The signature-enemy spawn entry the active faction injects into the pool. */
  signatureSpawnEntry(wave: number): SpawnEntry {
    const def = this.defForWave(wave);
    return {
      id: def.signatureEnemy,
      weight: def.signatureWeight,
      minWave: def.signatureMinWave,
    };
  }

  /** Boss enemy id for the active faction (used on boss waves). */
  bossForWave(wave: number): FactionDef["boss"] {
    return this.defForWave(wave).boss;
  }
}
