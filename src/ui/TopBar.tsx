import type { GameSnapshot } from "../game/types";
import { fmt } from "../game/math";
import { FACTION_DEFS } from "../game/data/factions";

export function TopBar({ snap }: { snap: GameSnapshot }) {
  const hpFrac = snap.maxIslandHp > 0 ? snap.islandHp / snap.maxIslandHp : 0;
  const mins = Math.floor(snap.timeSurvived / 60);
  const secs = Math.floor(snap.timeSurvived % 60);
  const faction = FACTION_DEFS[snap.activeFaction];

  return (
    <div className="topbar">
      <div className="stat-chip">
        <div className="label">Wave</div>
        <div className="value">{snap.wave}</div>
      </div>
      <div className="stat-chip" title={faction.counterHint}>
        <div className="label">Pirate King</div>
        <div className="value" style={{ color: faction.color }}>
          {faction.name}
        </div>
      </div>
      <div className="stat-chip">
        <div className="label">Enemies</div>
        <div className="value">{snap.enemiesRemaining}</div>
      </div>
      <div className="stat-chip">
        <div className="label">DPS</div>
        <div className="value">{fmt(snap.dps)}</div>
      </div>
      <div className="stat-chip">
        <div className="label">Time</div>
        <div className="value">
          {mins}:{secs.toString().padStart(2, "0")}
        </div>
      </div>
      <div className="stat-chip">
        <div className="label">Island HP</div>
        <div className="value">
          {Math.ceil(snap.islandHp)} / {snap.maxIslandHp}
        </div>
        <div className="hp-bar">
          <div
            style={{
              width: `${hpFrac * 100}%`,
              background: hpFrac > 0.35 ? "var(--hp)" : "var(--hp-low)",
            }}
          />
        </div>
      </div>
      {snap.dragon.eggClaimed && (
        <div className="stat-chip">
          <div className="label">Dragon Trust</div>
          <div className="value" style={{ color: "var(--trust)" }}>
            {snap.dragon.trust}
          </div>
        </div>
      )}
      {snap.corruption > 0 && (
        <div
          className="stat-chip"
          title="Crown Shard corruption: boosts your damage & gold, but the tide grows tougher and faster. Decays over time."
        >
          <div className="label">Corruption</div>
          <div className="value" style={{ color: "#b56cff" }}>
            {Math.round((snap.corruption / snap.corruptionMax) * 100)}%
          </div>
        </div>
      )}
    </div>
  );
}
