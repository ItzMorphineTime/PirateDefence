import type { EnemyId } from "../types";
import type { World } from "../world";
import { WAVE } from "../config";
import { SPAWN_POOL } from "../data/enemies";
import type { EnemyManager } from "./EnemyManager";

export class WaveManager {
  wave = 0;
  active = false;
  private toSpawn: EnemyId[] = [];
  private spawnTimer = 0;

  isBossWave(wave = this.wave): boolean {
    return wave > 0 && wave % WAVE.bossEvery === 0;
  }

  /** Multiplicative HP scaling for the current wave. */
  hpScale(wave = this.wave): number {
    return WAVE.hpBase * Math.pow(WAVE.hpGrowth, wave - 1);
  }

  /** Gold reward multiplier for kills this wave. */
  goldScale(wave = this.wave): number {
    return WAVE.goldRewardBase * Math.pow(WAVE.goldRewardGrowth, wave - 1);
  }

  enemyCount(wave = this.wave): number {
    return Math.floor(WAVE.baseCount + (wave - 1) * WAVE.countPerWave);
  }

  /** Begin the next wave: build the spawn queue. */
  startNextWave(): void {
    if (this.active) return;
    this.wave++;
    this.active = true;
    this.spawnTimer = 0;
    this.toSpawn = this.buildQueue();
  }

  private buildQueue(): EnemyId[] {
    if (this.isBossWave()) {
      // A boss plus a small escort.
      const queue: EnemyId[] = ["captain"];
      const escort = Math.floor(this.enemyCount() * 0.5);
      for (let i = 0; i < escort; i++) queue.push(this.pickNormal());
      return queue;
    }
    const count = this.enemyCount();
    const queue: EnemyId[] = [];
    for (let i = 0; i < count; i++) queue.push(this.pickNormal());
    return queue;
  }

  private pickNormal(): EnemyId {
    const eligible = SPAWN_POOL.filter((s) => this.wave >= s.minWave);
    const total = eligible.reduce((a, s) => a + s.weight, 0);
    let r = Math.random() * total;
    for (const s of eligible) {
      r -= s.weight;
      if (r <= 0) return s.id;
    }
    return "raider";
  }

  /** Drive spawns. Marks the wave inactive when queue is empty and field cleared. */
  update(world: World, dt: number, enemies: EnemyManager): void {
    if (!this.active) return;

    if (this.toSpawn.length > 0) {
      this.spawnTimer -= dt;
      while (this.spawnTimer <= 0 && this.toSpawn.length > 0) {
        const id = this.toSpawn.shift()!;
        const scale = id === "captain" ? this.hpScale() * WAVE.bossHpMultiplier : this.hpScale();
        enemies.spawn(world, id, scale);
        this.spawnTimer += WAVE.spawnInterval;
      }
    } else if (world.enemies.length === 0) {
      this.active = false;
    }
  }

  /** Restore from save. */
  load(wave: number): void {
    this.wave = wave;
    this.active = false;
    this.toSpawn = [];
  }
}
