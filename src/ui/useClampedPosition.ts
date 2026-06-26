import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Keeps a floating overlay fully visible inside its positioned parent.
 *
 * Given a desired anchor point (CSS pixels relative to the parent), it measures
 * the rendered element and clamps its `left`/`top` so the box never spills past
 * any edge of the parent. The overlay starts hidden (visibility) for one frame
 * to avoid a flash at the unclamped position.
 */
export function useClampedPosition<T extends HTMLElement>(
  anchor: { x: number; y: number },
  margin = 8
) {
  const ref = useRef<T | null>(null);
  const [style, setStyle] = useState<CSSProperties>({
    left: anchor.x,
    top: anchor.y,
    visibility: "hidden",
  });

  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) return;

    const pw = parent.clientWidth;
    const ph = parent.clientHeight;
    const w = el.offsetWidth;
    const h = el.offsetHeight;

    const left = clamp(anchor.x, margin, Math.max(margin, pw - w - margin));
    const top = clamp(anchor.y, margin, Math.max(margin, ph - h - margin));

    setStyle({ left, top, visibility: "visible" });
  }, [anchor.x, anchor.y, margin]);

  return { ref, style };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}
