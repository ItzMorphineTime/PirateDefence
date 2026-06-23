import { useEffect, useRef } from "react";
import type { GameEngine } from "../game/GameEngine";
import type { TowerId } from "../game/types";
import { BattlefieldRenderer } from "../render/BattlefieldRenderer";
import { dist } from "../game/math";

export function GameCanvas({
  engine,
  selectedTower,
  onSelectTower,
}: {
  engine: GameEngine;
  selectedTower: string | null;
  onSelectTower: (id: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<BattlefieldRenderer | null>(null);
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

  const handleClick = (e: React.MouseEvent) => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const v = renderer.toVirtual(e.clientX, e.clientY);

    // Ability targeting takes priority
    if (engine.armedAbility) {
      engine.onBattlefieldClick(v);
      return;
    }

    // Tower placement
    const sel = selRef.current as TowerId | null;
    if (sel) {
      const slot = nearestSlot(engine, v);
      if (slot && !slot.occupied) {
        const built = engine.buildTower(sel, slot.index);
        if (built) onSelectTower(null);
      }
    }
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
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onMouseMove={handleMove}
      style={{ cursor }}
    />
  );
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
