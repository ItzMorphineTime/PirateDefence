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

// --- Dragon hook ---
export const DRAGON_EGG_WAVE = 5;
export const DRAGON_TRUST_PER_BOSS = 3;
/** Passive tower-damage bonus per Dragon Trust point (claimed egg gives base). */
export const DRAGON_TRUST_DAMAGE_BONUS = 0.02; // +2% tower dmg per trust
export const DRAGON_EGG_BASE_TRUST = 1;

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
};

// --- Speed multipliers ---
export const SPEED_OPTIONS = [1, 3, 6];

// --- Save ---
export const SAVE_KEY = "tidehold_save_v1";
export const SAVE_VERSION = 2;
export const AUTOSAVE_INTERVAL = 8; // seconds (real time)

/** DPS is averaged over this rolling window (seconds). */
export const DPS_WINDOW = 3;
