import type { GameSnapshot } from "../game/types";
import { FACTION_DEFS } from "../game/data/factions";

export function WaveBanner({ snap }: { snap: GameSnapshot }) {
  if (!snap.bannerText) return null;
  const faction = FACTION_DEFS[snap.activeFaction];
  return (
    <div className="wave-banner">
      <div
        className="title"
        style={snap.gameOver ? undefined : { color: faction.color }}
      >
        {snap.bannerText}
      </div>
      {snap.gameOver ? (
        <div className="sub">Reset to evacuate the sanctuary</div>
      ) : (
        <div className="sub">{faction.counterHint}</div>
      )}
    </div>
  );
}
