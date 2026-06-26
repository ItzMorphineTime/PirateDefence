import type { GameEngine } from "../game/GameEngine";
import type { GameSnapshot, TowerId } from "../game/types";
import { BUILDABLE_TOWERS, TOWER_DEFS } from "../game/data/towers";
import { CostLabel } from "./costUtil";
import { useClampedPosition } from "./useClampedPosition";

/**
 * Canvas overlay that opens when an empty build slot is clicked. Lists the
 * buildable towers (color + name + cost); selecting one builds it directly into
 * the clicked slot. `anchor` is the desired position; the overlay self-clamps to
 * stay fully visible inside the battlefield.
 */
export function BuildMenu({
  engine,
  snap,
  slotIndex,
  anchor,
  onClose,
}: {
  engine: GameEngine;
  snap: GameSnapshot;
  slotIndex: number;
  anchor: { x: number; y: number };
  onClose: () => void;
}) {
  const { ref, style } = useClampedPosition<HTMLDivElement>(anchor);

  const build = (id: TowerId) => {
    if (engine.buildTower(id, slotIndex)) onClose();
  };

  return (
    <div
      ref={ref}
      className="build-menu"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bm-head">
        <span className="bm-title">Build Tower</span>
        <button className="td-close" onClick={onClose} title="Cancel">
          ✕
        </button>
      </div>
      <div className="bm-list">
        {BUILDABLE_TOWERS.map((id) => {
          const def = TOWER_DEFS[id];
          const affordable = engine.canAfford(def.buildCost);
          return (
            <button
              key={id}
              className="buy-row bm-row"
              disabled={!affordable}
              onClick={() => build(id)}
            >
              <span
                className="dot"
                style={{
                  background: def.color,
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                }}
              />
              <span className="name">{def.name}</span>
              <span className="cost">
                <CostLabel cost={def.buildCost} resources={snap.resources} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
