import type { GameSnapshot } from "../game/types";

export function WaveBanner({ snap }: { snap: GameSnapshot }) {
  if (!snap.bannerText) return null;
  return (
    <div className="wave-banner">
      <div className="title">{snap.bannerText}</div>
      {snap.gameOver && <div className="sub">Reset to evacuate the sanctuary</div>}
    </div>
  );
}
