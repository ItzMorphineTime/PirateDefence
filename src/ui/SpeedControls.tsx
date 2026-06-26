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
      <button
        className={`toggle-btn${snap.autoRetry ? " on" : ""}`}
        onClick={() => engine.toggleAutoRetry()}
        title="On defeat, restart the current wave instead of ending the run."
      >
        Auto-Retry {snap.autoRetry ? "ON" : "OFF"}
      </button>

      {/* Manual wave stepping (only between waves). */}
      <div className="grp wave-step">
        <button
          className="speed-btn"
          disabled={!snap.canStepWave || snap.wave <= 0}
          onClick={() => engine.prevWave()}
          title="Step back one wave"
        >
          ◀
        </button>
        <span className="wave-step-label">Wave {snap.wave}</span>
        <button
          className="speed-btn"
          disabled={!snap.canStepWave}
          onClick={() => engine.nextWave()}
          title="Advance one wave"
        >
          ▶
        </button>
      </div>

      {/* Target wave for auto-advance (0 = endless). */}
      <label className="target-wave">
        Stop at wave
        <input
          type="number"
          min={0}
          value={snap.targetWave || ""}
          placeholder="∞"
          onChange={(e) => engine.setTargetWave(Number(e.target.value) || 0)}
        />
      </label>

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
