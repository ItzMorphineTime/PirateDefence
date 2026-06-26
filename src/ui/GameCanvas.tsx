import { useEffect, useRef, useState } from "react";
import type { GameEngine } from "../game/GameEngine";
import type { GameSnapshot, TowerId, Vec2 } from "../game/types";
import { BattlefieldRenderer } from "../render/BattlefieldRenderer";
import { dist } from "../game/math";
import { BuildMenu } from "./BuildMenu";
import { TowerDetailPanel } from "./TowerDetailPanel";

/** Open overlay anchored to a battlefield position (CSS pixels). */
type Overlay =
  | { kind: "build"; slotIndex: number; x: number; y: number }
  | { kind: "detail"; x: number; y: number }
  | null;

export function GameCanvas({
  engine,
  snap,
  selectedTower,
  onSelectTower,
}: {
  engine: GameEngine;
  snap: GameSnapshot;
  selectedTower: string | null;
  onSelectTower: (id: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<BattlefieldRenderer | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  // Keep latest selection available to event handlers without re-binding.
  const selRef = useRef<string | null>(selectedTower);
  selRef.current = selectedTower;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const renderer = new BattlefieldRenderer(canvas, engine);
    rendererRef.current = renderer;

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      renderer.render();
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => renderer.resize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [engine]);

  const closeOverlay = () => {
    setOverlay(null);
    engine.selectTower(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const v = renderer.toVirtual(e.clientX, e.clientY);

    // Ability targeting takes priority
    if (engine.armedAbility) {
      engine.onBattlefieldClick(v);
      return;
    }

    // Tower placement via the side-panel armed tower (legacy quick-build path).
    const sel = selRef.current as TowerId | null;
    if (sel) {
      const slot = nearestSlot(engine, v);
      if (slot && !slot.occupied) {
        const built = engine.buildTower(sel, slot.index);
        if (built) onSelectTower(null);
      }
      return;
    }

    // Click a placed tower → open its detail popup beside it.
    const tower = engine.towerAt(v);
    if (tower) {
      engine.selectTower(tower.uid);
      setOverlay({ kind: "detail", ...anchorFor(renderer, tower.pos) });
      return;
    }

    // Click an empty slot → open the build menu at that slot.
    const slot = nearestSlot(engine, v);
    if (slot && !slot.occupied) {
      engine.selectTower(null);
      setOverlay({
        kind: "build",
        slotIndex: slot.index,
        ...anchorFor(renderer, slot.pos),
      });
      return;
    }

    // Clicked empty water → dismiss any open overlay.
    closeOverlay();
  };

  const handleMove = (e: React.MouseEvent) => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    if (!selRef.current) {
      renderer.hoverSlot = -1;
      return;
    }
    const v = renderer.toVirtual(e.clientX, e.clientY);
    const slot = nearestSlot(engine, v);
    renderer.hoverSlot = slot && !slot.occupied ? slot.index : -1;
  };

  const cursor = selectedTower || engine.armedAbility ? "crosshair" : "default";

  return (
    <div className="canvas-wrap">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMove}
        style={{ cursor }}
      />
      {overlay?.kind === "build" && (
        <BuildMenu
          engine={engine}
          snap={snap}
          slotIndex={overlay.slotIndex}
          anchor={{ x: overlay.x, y: overlay.y }}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay?.kind === "detail" && snap.selectedTower && (
        <TowerDetailPanel
          engine={engine}
          snap={snap}
          anchor={{ x: overlay.x, y: overlay.y }}
          onClose={closeOverlay}
        />
      )}
    </div>
  );
}

/** Anchor an overlay just to the right of a battlefield point (CSS pixels). */
function anchorFor(
  renderer: BattlefieldRenderer,
  pos: Vec2
): { x: number; y: number } {
  const s = renderer.toScreen(pos);
  return { x: s.x + 18, y: s.y - 10 };
}

function nearestSlot(engine: GameEngine, v: { x: number; y: number }) {
  let best: { index: number; pos: { x: number; y: number }; occupied: boolean } | null =
    null;
  let bestD = 40; // virtual-space click tolerance
  for (const slot of engine.slotInfo()) {
    const d = dist(slot.pos, v);
    if (d < bestD) {
      bestD = d;
      best = slot;
    }
  }
  return best;
}
