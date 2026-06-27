// ============================================================================
// Tunable constants. The battlefield uses a fixed virtual coordinate space
// (VIRT_W x VIRT_H) that the renderer scales to the canvas size.
// ============================================================================

export const VIRT_W = 1000;
export const VIRT_H = 800;

export const CENTER = { x: VIRT_W / 2, y: VIRT_H / 2 };

/** Island core radius (enemies reaching this damage the core). */
export const ISLAND_RADIUS = 140;

/** Radii of the two concentric rings of tower build slots on the island. */
export const TOWER_RING_RADIUS = 185; // outer slot ring
export const TOWER_RING_INNER_RADIUS = 110; // inner slot ring
/** Slots per ring; total build slots = outer + inner. */
export const TOWER_SLOT_OUTER_COUNT = 8;
export const TOWER_SLOT_INNER_COUNT = 6;
export const TOWER_SLOT_COUNT = TOWER_SLOT_OUTER_COUNT + TOWER_SLOT_INNER_COUNT;

/** Orbit ring radii for ships (scaled out past the larger island + slot rings). */
export const ORBIT_RADII = {
  inner: 245,
  middle: 305,
  outer: 365,
};

/** Enemies spawn just outside this radius. */
export const SPAWN_RADIUS = 480;

export const BASE_ISLAND_HP = 100;

// --- Mana ---
export const BASE_MAX_MANA = 100;
export const BASE_MANA_REGEN = 4; // per second

// --- Starting resources ---
export const START_RESOURCES = {
  gold: 120,
  salvage: 30,
  powder: 20,
  mana: 50,
};

// --- Wave scaling ---
export const WAVE = {
  baseCount: 6,
  countPerWave: 1.4,
  hpBase: 1,
  hpGrowth: 1.18, // multiplicative per wave
  goldRewardBase: 1,
  goldRewardGrowth: 1.09,
  spawnInterval: 0.75, // seconds between spawns within a wave
  bossEvery: 25,
  bossHpMultiplier: 14,
};

// --- Dragon sanctuary ---
export const DRAGON_EGG_WAVE = 5;
/** Trust earned per boss defeated (Trust is the spend-to-hatch currency). */
export const DRAGON_TRUST_PER_BOSS = 5;
/** Trust granted the moment the egg is claimed (a small head start). */
export const DRAGON_EGG_BASE_TRUST = 4;
/** Trust earned each time a (non-boss) wave is cleared after claiming the egg. */
export const DRAGON_TRUST_PER_WAVE = 1;

/**
 * Per-dragon hatch costs (in Trust) and passive aura magnitudes. Hatching a
 * dragon permanently activates its aura; the Elder grants a smaller slice of
 * every other aura at once.
 */
export const DRAGON = {
  // Hatch costs (Trust).
  blazeHatchCost: 6,
  iceyHatchCost: 8,
  speedyHatchCost: 10,
  elderHatchCost: 18,
  // Aura magnitudes.
  blazeTowerDamage: 0.2, // +20% tower damage
  iceyEnemySlow: 0.18, // enemies move 18% slower
  speedyFireRate: 0.18, // +18% tower fire rate
  elderAll: 0.1, // Elder contributes +10% of each of the above
  /** Lowest the global enemy-speed multiplier may fall to from slow auras. */
  enemySlowFloor: 0.4,
};

/** Active dragon ability tunables (Blaze Breath). */
export const DRAGON_ABILITY_TUNING = {
  blazeBreathDamage: 130,
  blazeBreathRadius: 110,
  blazeBreathBurnDuration: 4,
  blazeBreathBurnDps: 14,
};

// --- Status effects (defaults; per-source values may override) ---
export const STATUS = {
  burnDuration: 3, // seconds
  burnDps: 6, // damage per second
  slowDuration: 2.5,
  slowFactor: 0.5, // 50% speed
  stunDuration: 0.8,
  shredDuration: 4,
  shredAmount: 3, // flat armor removed
};

// --- Per-tower upgrades (Phase 9.5) ---
// Each placed tower can be individually upgraded by clicking it. Effects stack
// on top of the global upgrade tree. Cost scales with the tower's current level
// for that kind, paid in gold + salvage.
export const TOWER_UPGRADE = {
  maxLevel: 5,
  dmgPerLevel: 0.25, // +25% damage per level (multiplicative)
  rangePerLevel: 14, // +14 flat range per level
  ratePerLevel: 0.08, // -8% fire interval per level (faster), capped below
  rateFloor: 0.4, // fire interval can't drop below 40% of base
  costGoldBase: 60,
  costSalvageBase: 20,
  costGrowth: 1.6, // multiplier per existing level
  sellRefund: 0.5, // fraction of invested value returned when a tower is sold
};

// --- Corruption & Crown Shard (Phase 6) ---
// Corruption is a 0..100 risk/reward meter. It is raised by wielding the
// forbidden Crown Shard ability and decays slowly when left alone. Higher
// corruption grants escalating offense/economy bonuses but makes enemies
// tougher and faster — power bought at growing threat.
export const CORRUPTION = {
  max: 100,
  /** Corruption added each time the Crown Shard is unleashed (30% of the meter). */
  perShardCast: 30,
  /** Passive corruption shed per second when not being raised. */
  decayPerSec: 0.6,
  // --- Effect magnitudes, expressed per full meter (× corruption/max) ---
  /** Up to +100% tower & ship damage at max corruption. */
  damageBonusAtMax: 1.0,
  /** Up to +120% gold at max corruption. */
  goldBonusAtMax: 1.2,
  /** Up to +90% enemy HP at max corruption (threat). */
  enemyHpAtMax: 0.9,
  /** Up to +60% enemy speed at max corruption (threat). */
  enemySpeedAtMax: 0.6,
};

/** Crown Shard active-ability tunables (forbidden AoE + gold windfall). */
export const CROWN_SHARD_TUNING = {
  damage: 260,
  radius: 150,
  /** Gold minted instantly on cast (flat, before goldMult). */
  goldWindfall: 120,
};

// --- Prestige ("Sanctuary Evacuation") — Phase 7 ---
// Evacuating the sanctuary wipes the current run but banks **Tideglass**, a
// persistent meta-currency spent on permanent meta-upgrades that carry into
// every future run. Tideglass is milestone-gated: only runs that push past
// `waveGate` earn anything, and the yield grows with the *square root* of the
// distance past the gate (diminishing returns), plus a flat bonus per boss
// felled. Voluntary evacuation pays full value; being defeated (game over)
// pays only `defeatFraction` of it.
export const PRESTIGE = {
  /** Separate localStorage key so meta-progress survives the run wipe. */
  saveKey: "tidehold_prestige_v1",
  saveVersion: 1,
  /** No Tideglass is earned until the highest wave reached exceeds this. */
  waveGate: 10,
  /** Yield multiplier on sqrt(wavesPastGate). */
  perWaveRootScale: 1.5,
  /** Flat Tideglass per boss killed this run. */
  perBossKill: 1,
  /** Fraction of the reward granted when evacuation is forced by defeat. */
  defeatFraction: 0.1,
};

// --- Speed multipliers ---
export const SPEED_OPTIONS = [1, 3, 6];

// --- Save ---
export const SAVE_KEY = "tidehold_save_v1";
export const SAVE_VERSION = 4;
export const AUTOSAVE_INTERVAL = 8; // seconds (real time)

/** DPS is averaged over this rolling window (seconds). */
export const DPS_WINDOW = 3;
