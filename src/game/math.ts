import type { Vec2 } from "./types";

export function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function distSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function angleBetween(from: Vec2, to: Vec2): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function pointOnCircle(center: Vec2, radius: number, angle: number): Vec2 {
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

let uidCounter = 1;
export function nextUid(): number {
  return uidCounter++;
}

/** Format a number compactly: 1.2K, 3.4M, etc. */
export function fmt(n: number): string {
  if (n < 1000) return Math.floor(n).toString();
  const units = ["", "K", "M", "B", "T", "Qa", "Qi"];
  let u = 0;
  let v = n;
  while (v >= 1000 && u < units.length - 1) {
    v /= 1000;
    u++;
  }
  return v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0) + units[u];
}
