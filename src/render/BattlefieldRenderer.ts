// ============================================================================
// Draws the battlefield each frame from engine/world state. Pure canvas; no
// React. Uses a fixed virtual coordinate space scaled to fit the canvas.
// ============================================================================
import type { GameEngine } from "../game/GameEngine";
import { ENEMY_DEFS } from "../game/data/enemies";
import { TOWER_DEFS } from "../game/data/towers";
import { SHIP_DEFS } from "../game/data/ships";
import { DRAGON_DEFS } from "../game/data/dragons";
import {
  VIRT_W,
  VIRT_H,
  CENTER,
  ISLAND_RADIUS,
  ORBIT_RADII,
  SPAWN_RADIUS,
} from "../game/config";
import type { Vec2 } from "../game/types";

/**
 * Cosmetic horizontal sinewave swell. Several layered rows of sine curves
 * scroll sideways across the sea at different speeds, amplitudes, and tints to
 * fake parallax ocean movement. Purely decorative.
 */
const SEA_WAVE_ROWS = 9; // number of horizontal sinewave bands down the canvas
const SEA_WAVE_LAYERS: {
  amp: number; // vertical wave height (virtual units)
  len: number; // horizontal wavelength (virtual units)
  speed: number; // horizontal scroll speed (virtual units / sec)
  color: string;
  width: number;
}[] = [
  { amp: 7, len: 240, speed: 26, color: "rgba(120,180,220,0.16)", width: 2.2 },
  { amp: 5, len: 170, speed: -18, color: "rgba(150,205,235,0.13)", width: 1.6 },
  { amp: 3.5, len: 110, speed: 34, color: "rgba(90,150,195,0.10)", width: 1.2 },
];

export class BattlefieldRenderer {
  private ctx: CanvasRenderingContext2D;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private dpr = 1;
  hoverSlot = -1;

  constructor(private canvas: HTMLCanvasElement, private engine: GameEngine) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context unavailable");
    this.ctx = ctx;
    this.resize();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(rect.width * this.dpr);
    this.canvas.height = Math.floor(rect.height * this.dpr);
    // Fit virtual space (letterboxed)
    const sx = rect.width / VIRT_W;
    const sy = rect.height / VIRT_H;
    this.scale = Math.min(sx, sy);
    this.offsetX = (rect.width - VIRT_W * this.scale) / 2;
    this.offsetY = (rect.height - VIRT_H * this.scale) / 2;
  }

  /** Convert a canvas/client point (relative to canvas) into virtual coords. */
  toVirtual(clientX: number, clientY: number): Vec2 {
    const rect = this.canvas.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    return {
      x: (cx - this.offsetX) / this.scale,
      y: (cy - this.offsetY) / this.scale,
    };
  }

  /**
   * Convert virtual coords to CSS pixels relative to the canvas element (no
   * dpr). Used to anchor HTML overlays (build menu / tower popup) on the map.
   */
  toScreen(v: Vec2): Vec2 {
    return {
      x: this.offsetX + v.x * this.scale,
      y: this.offsetY + v.y * this.scale,
    };
  }

  private tx(x: number): number {
    return this.offsetX * this.dpr + x * this.scale * this.dpr;
  }
  private ty(y: number): number {
    return this.offsetY * this.dpr + y * this.scale * this.dpr;
  }
  private s(v: number): number {
    return v * this.scale * this.dpr;
  }

  render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawSea();
    this.drawOrbitRings();
    this.drawIsland();
    this.drawSlots();
    this.drawTowerRanges();
    this.drawEffects();
    this.drawEnemies();
    this.drawProjectiles();
    this.drawTowers();
    this.drawShips();
    this.drawDragons();

    // Armed-ability targeting hint (player or dragon ability)
    if (this.engine.armedAbility || this.engine.armedDragonAbility) {
      this.drawArmedHint();
    }
  }

  private drawSea(): void {
    const ctx = this.ctx;
    const cx = this.tx(CENTER.x);
    const cy = this.ty(CENTER.y);
    const time = this.engine.world.time;

    // Horizontal scrolling sinewaves across the whole sea. We clip to the sea
    // annulus (inside the spawn perimeter, outside the island) so the swell only
    // appears on water, then draw several parallax layers of sine curves that
    // scroll sideways and bob over time.
    ctx.save();
    ctx.beginPath();
    // Outer bound = spawn perimeter disk.
    ctx.arc(cx, cy, this.s(SPAWN_RADIUS), 0, Math.PI * 2);
    // Inner bound = island shoreline (counter-clockwise → even-odd hole).
    ctx.arc(cx, cy, this.s(ISLAND_RADIUS + 18), 0, Math.PI * 2, true);
    ctx.clip("evenodd");

    const top = CENTER.y - SPAWN_RADIUS;
    const bottom = CENTER.y + SPAWN_RADIUS;
    const left = CENTER.x - SPAWN_RADIUS;
    const right = CENTER.x + SPAWN_RADIUS;
    const rowGap = (bottom - top) / SEA_WAVE_ROWS;

    for (const layer of SEA_WAVE_LAYERS) {
      ctx.strokeStyle = layer.color;
      ctx.lineWidth = this.s(layer.width);
      const k = (Math.PI * 2) / layer.len; // angular wavenumber
      const shift = time * layer.speed; // horizontal scroll offset
      for (let row = 0; row <= SEA_WAVE_ROWS; row++) {
        const baseY = top + row * rowGap;
        // Stagger each row's phase so crests don't line up vertically.
        const rowPhase = row * 0.9;
        ctx.beginPath();
        let started = false;
        for (let vx = left; vx <= right; vx += 8) {
          const vy =
            baseY + layer.amp * Math.sin(k * (vx + shift) + rowPhase);
          const px = this.tx(vx);
          const py = this.ty(vy);
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }
    }
    ctx.restore();

    // faint spawn perimeter
    ctx.strokeStyle = "rgba(80,130,170,0.15)";
    ctx.lineWidth = this.s(2);
    ctx.beginPath();
    ctx.arc(cx, cy, this.s(SPAWN_RADIUS), 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawOrbitRings(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = "rgba(120,170,210,0.10)";
    ctx.lineWidth = this.s(1);
    for (const r of Object.values(ORBIT_RADII)) {
      ctx.beginPath();
      ctx.arc(this.tx(CENTER.x), this.ty(CENTER.y), this.s(r), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawIsland(): void {
    const ctx = this.ctx;
    const cx = this.tx(CENTER.x);
    const cy = this.ty(CENTER.y);

    // Shoreline
    ctx.beginPath();
    ctx.arc(cx, cy, this.s(ISLAND_RADIUS + 22), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(200,180,120,0.10)";
    ctx.fill();

    // Island core
    const hpFrac = Math.max(
      0,
      this.engine.world.islandHp / this.engine.world.maxIslandHp
    );
    ctx.beginPath();
    ctx.arc(cx, cy, this.s(ISLAND_RADIUS), 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(cx, cy, this.s(10), cx, cy, this.s(ISLAND_RADIUS));
    grad.addColorStop(0, "#3a5a3e");
    grad.addColorStop(1, "#243b2a");
    ctx.fillStyle = grad;
    ctx.fill();

    // Circular HP gauge around the shoreline: a faint full-circle track plus a
    // bright arc that sweeps from full (12 o'clock, clockwise) down to empty as
    // island HP drops. Color eases from green → amber → red with HP.
    const gaugeR = this.s(ISLAND_RADIUS + 6);
    const start = -Math.PI / 2; // 12 o'clock
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, gaugeR, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = this.s(4);
    ctx.stroke();
    if (hpFrac > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, gaugeR, start, start + Math.PI * 2 * hpFrac);
      ctx.strokeStyle = hpGaugeColor(hpFrac);
      ctx.lineWidth = this.s(5);
      ctx.stroke();
    }
    ctx.lineCap = "butt";

    // Nursery marker (if egg claimed)
    if (this.engine.dragons.state.eggClaimed) {
      ctx.beginPath();
      ctx.arc(cx, cy, this.s(24), 0, Math.PI * 2);
      ctx.fillStyle = "#c77dff";
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = `${this.s(24)}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🥚", cx, cy);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = `bold ${this.s(18)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TIDEHOLD", cx, cy);
    }
  }

  private drawSlots(): void {
    const ctx = this.ctx;
    for (const slot of this.engine.slotInfo()) {
      if (slot.occupied) continue;
      const x = this.tx(slot.pos.x);
      const y = this.ty(slot.pos.y);
      ctx.beginPath();
      ctx.arc(x, y, this.s(15), 0, Math.PI * 2);
      ctx.fillStyle =
        this.hoverSlot === slot.index ? "rgba(47,191,160,0.5)" : "rgba(60,86,128,0.35)";
      ctx.fill();
      ctx.strokeStyle = "rgba(120,160,200,0.6)";
      ctx.lineWidth = this.s(1.5);
      ctx.setLineDash([this.s(4), this.s(4)]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = `bold ${this.s(16)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", x, y);
    }
  }

  /**
   * Draw the range (or support-aura) ring only for the currently selected
   * tower. Showing every tower's range at once was visually noisy; the ring is
   * now a deliberate, clearly-visible indicator tied to selection.
   */
  private drawTowerRanges(): void {
    const ctx = this.ctx;
    const selectedUid = this.engine.selectedTowerUid;
    if (selectedUid == null) return;
    const tower = this.engine.world.towers.find((t) => t.uid === selectedUid);
    if (!tower) return;

    const def = TOWER_DEFS[tower.defId];
    const x = this.tx(tower.pos.x);
    const y = this.ty(tower.pos.y);

    if (def.range <= 0) {
      // Support aura ring (Watchtower range aura or Ember Shrine damage aura).
      const aura = def.auraRadius ?? 0;
      if (aura > 0) {
        ctx.beginPath();
        ctx.arc(x, y, this.s(aura), 0, Math.PI * 2);
        ctx.fillStyle = def.damageAura
          ? hexAlpha(def.color, 0.10)
          : "rgba(110,168,216,0.08)";
        ctx.fill();
        ctx.strokeStyle = def.damageAura
          ? hexAlpha(def.color, 0.55)
          : "rgba(110,168,216,0.5)";
        ctx.lineWidth = this.s(1.5);
        ctx.stroke();
      }
      return;
    }

    const range = this.engine.towers.effectiveRange(this.engine.world, tower);
    ctx.beginPath();
    ctx.arc(x, y, this.s(range), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,214,102,0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,214,102,0.45)";
    ctx.lineWidth = this.s(1.5);
    ctx.stroke();
  }

  private drawEnemies(): void {
    const ctx = this.ctx;
    for (const e of this.engine.world.enemies) {
      const def = ENEMY_DEFS[e.defId];
      const x = this.tx(e.pos.x);
      const y = this.ty(e.pos.y);
      const r = this.s(def.radius);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = def.color;
      ctx.fill();
      if (e.isBoss) {
        ctx.lineWidth = this.s(3);
        ctx.strokeStyle = "#ffd9e2";
        ctx.stroke();
      }

      // HP bar
      const frac = Math.max(0, e.hp / e.maxHp);
      if (frac < 1) {
        const bw = r * 2;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(x - bw / 2, y - r - this.s(7), bw, this.s(4));
        ctx.fillStyle = frac > 0.4 ? "#5ad17e" : "#e05858";
        ctx.fillRect(x - bw / 2, y - r - this.s(7), bw * frac, this.s(4));
      }
    }
  }

  private drawProjectiles(): void {
    const ctx = this.ctx;
    for (const p of this.engine.world.projectiles) {
      ctx.beginPath();
      ctx.arc(this.tx(p.pos.x), this.ty(p.pos.y), this.s(p.splash > 0 ? 5 : 3.5), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
  }

  private drawEffects(): void {
    const ctx = this.ctx;
    for (const fx of this.engine.world.effects) {
      const a = fx.life / fx.maxLife;
      ctx.beginPath();
      ctx.arc(this.tx(fx.pos.x), this.ty(fx.pos.y), this.s(fx.radius * (1.2 - a * 0.4)), 0, Math.PI * 2);
      ctx.fillStyle = hexAlpha(fx.color, a * 0.4);
      ctx.fill();
      ctx.strokeStyle = hexAlpha(fx.color, a * 0.8);
      ctx.lineWidth = this.s(2);
      ctx.stroke();
    }
  }

  private drawTowers(): void {
    const ctx = this.ctx;
    const selectedUid = this.engine.selectedTowerUid;
    for (const tower of this.engine.world.towers) {
      const def = TOWER_DEFS[tower.defId];
      const x = this.tx(tower.pos.x);
      const y = this.ty(tower.pos.y);
      // Selection highlight ring beneath the tower body.
      if (tower.uid === selectedUid) {
        ctx.beginPath();
        ctx.arc(x, y, this.s(18), 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,214,102,0.95)";
        ctx.lineWidth = this.s(2.5);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(x, y, this.s(13), 0, Math.PI * 2);
      ctx.fillStyle = def.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = this.s(2);
      ctx.stroke();
      // initial letter
      ctx.fillStyle = "#0b1a0e";
      ctx.font = `bold ${this.s(13)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(def.name[0], x, y);
    }
  }

  private drawShips(): void {
    const ctx = this.ctx;
    for (const ship of this.engine.world.ships) {
      const def = SHIP_DEFS[ship.defId];
      const pos = this.engine.ships.pos(ship);
      const x = this.tx(pos.x);
      const y = this.ty(pos.y);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ship.angle + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -this.s(11));
      ctx.lineTo(this.s(7), this.s(9));
      ctx.lineTo(-this.s(7), this.s(9));
      ctx.closePath();
      ctx.fillStyle = def.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = this.s(1.5);
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Hatched dragons circle slowly above the island nursery, each at a slightly
   * different radius and phase. Purely cosmetic; reads the engine's hatched
   * list directly so it stays in sync without a snapshot.
   */
  private drawDragons(): void {
    const hatched = this.engine.dragons.state.hatched;
    if (hatched.length === 0) return;
    const ctx = this.ctx;
    const time = this.engine.world.time;
    const cx = CENTER.x;
    const cy = CENTER.y;

    hatched.forEach((id, i) => {
      const def = DRAGON_DEFS[id];
      const orbitR = 40 + i * 12;
      const phase = (i / hatched.length) * Math.PI * 2;
      const angle = time * 0.6 + phase;
      const vx = cx + Math.cos(angle) * orbitR;
      const vy = cy + Math.sin(angle) * orbitR;
      const x = this.tx(vx);
      const y = this.ty(vy);
      // Body
      ctx.beginPath();
      ctx.arc(x, y, this.s(8), 0, Math.PI * 2);
      ctx.fillStyle = def.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = this.s(1.5);
      ctx.stroke();
      // Simple flapping wings (two short strokes perpendicular to travel).
      const flap = Math.sin(time * 8 + phase) * 0.5;
      ctx.strokeStyle = hexAlpha(def.color, 0.85);
      ctx.lineWidth = this.s(2);
      const wing = this.s(9);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - wing, y - wing * (0.6 + flap));
      ctx.moveTo(x, y);
      ctx.lineTo(x + wing, y - wing * (0.6 - flap));
      ctx.stroke();
    });
  }

  private drawArmedHint(): void {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(224,122,60,0.9)";
    ctx.font = `bold ${this.s(15)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(
      "Click the battlefield to target",
      this.tx(CENTER.x),
      this.ty(VIRT_H - 30)
    );
  }
}

/** Island HP-gauge color: green when healthy, amber mid, red when critical. */
function hpGaugeColor(frac: number): string {
  if (frac > 0.6) return "#5ad17e";
  if (frac > 0.3) return "#e0c45c";
  return "#e05858";
}

function hexAlpha(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
