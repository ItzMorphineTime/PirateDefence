// ============================================================================
// Draws the battlefield each frame from engine/world state. Pure canvas; no
// React. Uses a fixed virtual coordinate space scaled to fit the canvas.
// ============================================================================
import type { GameEngine } from "../game/GameEngine";
import { ENEMY_DEFS } from "../game/data/enemies";
import { TOWER_DEFS } from "../game/data/towers";
import { SHIP_DEFS } from "../game/data/ships";
import {
  VIRT_W,
  VIRT_H,
  CENTER,
  ISLAND_RADIUS,
  ORBIT_RADII,
  SPAWN_RADIUS,
} from "../game/config";
import type { Vec2 } from "../game/types";

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

    // Armed-ability targeting hint
    if (this.engine.armedAbility) {
      this.drawArmedHint();
    }
  }

  private drawSea(): void {
    const ctx = this.ctx;
    // faint spawn perimeter
    ctx.strokeStyle = "rgba(80,130,170,0.15)";
    ctx.lineWidth = this.s(2);
    ctx.beginPath();
    ctx.arc(this.tx(CENTER.x), this.ty(CENTER.y), this.s(SPAWN_RADIUS), 0, Math.PI * 2);
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
    const hpFrac = this.engine.world.islandHp / this.engine.world.maxIslandHp;
    ctx.beginPath();
    ctx.arc(cx, cy, this.s(ISLAND_RADIUS), 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(cx, cy, this.s(10), cx, cy, this.s(ISLAND_RADIUS));
    grad.addColorStop(0, "#3a5a3e");
    grad.addColorStop(1, "#243b2a");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = this.s(3);
    ctx.strokeStyle = hpFrac > 0.35 ? "#5ad17e" : "#e05858";
    ctx.stroke();

    // Nursery marker (if egg claimed)
    if (this.engine.dragons.state.eggClaimed) {
      ctx.beginPath();
      ctx.arc(cx, cy, this.s(16), 0, Math.PI * 2);
      ctx.fillStyle = "#c77dff";
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = `${this.s(16)}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🥚", cx, cy);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = `bold ${this.s(13)}px sans-serif`;
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

  private drawTowerRanges(): void {
    const ctx = this.ctx;
    for (const tower of this.engine.world.towers) {
      const def = TOWER_DEFS[tower.defId];
      if (def.range <= 0) {
        // Watchtower aura
        const aura = def.auraRadius ?? 0;
        ctx.beginPath();
        ctx.arc(this.tx(tower.pos.x), this.ty(tower.pos.y), this.s(aura), 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(110,168,216,0.12)";
        ctx.lineWidth = this.s(1);
        ctx.stroke();
        continue;
      }
      const range = this.engine.towers.effectiveRange(this.engine.world, tower);
      ctx.beginPath();
      ctx.arc(this.tx(tower.pos.x), this.ty(tower.pos.y), this.s(range), 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = this.s(1);
      ctx.stroke();
    }
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
    for (const tower of this.engine.world.towers) {
      const def = TOWER_DEFS[tower.defId];
      const x = this.tx(tower.pos.x);
      const y = this.ty(tower.pos.y);
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

function hexAlpha(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
