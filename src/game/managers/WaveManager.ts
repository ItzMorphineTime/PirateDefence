import type { EnemyId } from "../types";
import type { World } from "../world";
import { WAVE } from "../config";
import { ENEMY_DEFS, SPAWN_POOL, type SpawnEntry } from "../data/enemies";
import type { EnemyManager } from "./EnemyManager";
import type { FactionManager } from "./FactionManager";

export class WaveManager {
  wave = 0;
  active = false;
  private toSpawn: EnemyId[] = [];
  private spawnTimer = 0;

  constructor(private factions: FactionManager) {}

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
      // The active faction's boss plus a small escort drawn from its pool.
      const queue: EnemyId[] = [this.factions.bossForWave(this.wave)];
      const escort = Math.floor(this.enemyCount() * 0.5);
      for (let i = 0; i < escort; i++) queue.push(this.pickNormal());
      return queue;
    }
    const count = this.enemyCount();
    const queue: EnemyId[] = [];
    for (let i = 0; i < count; i++) queue.push(this.pickNormal());
    return queue;
  }

  /** Effective spawn pool = neutral starters + the active faction's signature. */
  private pool(): SpawnEntry[] {
    return [...SPAWN_POOL, this.factions.signatureSpawnEntry(this.wave)];
  }

  private pickNormal(): EnemyId {
    const eligible = this.pool().filter((s) => this.wave >= s.minWave);
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
        const base = ENEMY_DEFS[id].isBoss
          ? this.hpScale() * WAVE.bossHpMultiplier
          : this.hpScale();
        // Crown Shard corruption makes the whole tide tougher.
        const scale = base * world.bonuses.corruptionEnemyHpMult;
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
