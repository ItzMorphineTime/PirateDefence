import type { GameEngine } from "../game/GameEngine";
import type { GameSnapshot } from "../game/types";
import { SPEED_OPTIONS } from "../game/config";

export function SpeedControls({
  engine,
  snap,
}: {
  engine: GameEngine;
  snap: GameSnapshot;
}) {
  return (
    <div className="speed-controls">
      <div className="grp">
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            className={`speed-btn${snap.speed === s ? " active" : ""}`}
            onClick={() => engine.setSpeed(s)}
          >
            {s}x
          </button>
        ))}
      </div>
      <button
        className={`toggle-btn${snap.autoAdvance ? " on" : ""}`}
        onClick={() => engine.toggleAutoAdvance()}
      >
        Auto-Advance {snap.autoAdvance ? "ON" : "OFF"}
      </button>
      {!snap.waveActive && !snap.gameOver && (
        <button className="toggle-btn" onClick={() => engine.startWave()}>
          ▶ Start Wave {snap.wave + 1}
        </button>
      )}
      {snap.gameOver && (
        <button className="toggle-btn" onClick={() => engine.reset()}>
          Evacuate &amp; Reset
        </button>
      )}
    </div>
  );
}
