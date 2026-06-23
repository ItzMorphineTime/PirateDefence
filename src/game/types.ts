// ============================================================================
// Shared types for Tidehold: Dragonwake Defense
// ============================================================================

export type ResourceId = "gold" | "salvage" | "powder" | "mana";

export type ResourceMap = Record<ResourceId, number>;

/** Family tags reserved for future Land/Sea/Sky/Shadow upgrade groupings. */
export type Family = "land" | "sea" | "sky" | "shadow";

// ---------------------------------------------------------------------------
// Vectors
// ---------------------------------------------------------------------------
export interface Vec2 {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Towers
// ---------------------------------------------------------------------------
export type TowerId = "archer" | "cannon" | "ballista" | "watchtower";

export interface TowerDef {
  id: TowerId;
  name: string;
  family: Family;
  desc: string;
  buildCost: Partial<ResourceMap>;
  /** Base damage per shot (0 for support towers). */
  damage: number;
  /** Seconds between shots. */
  fireInterval: number;
  range: number;
  /** Splash radius; 0 = single target. */
  splash: number;
  /** Damage multiplier vs boss enemies. */
  bossMultiplier: number;
  /** Support aura: adds this much range to towers within auraRadius. */
  rangeAura?: number;
  auraRadius?: number;
  projectileSpeed: number;
  color: string;
}

export interface Tower {
  uid: number;
  defId: TowerId;
  pos: Vec2;
  slotIndex: number;
  cooldown: number; // time until next shot
}

// ---------------------------------------------------------------------------
// Ships
// ---------------------------------------------------------------------------
export type ShipId = "cutter" | "gunboat" | "sloop";

export type OrbitRing = "inner" | "middle" | "outer";

export interface ShipDef {
  id: ShipId;
  name: string;
  desc: string;
  buildCost: Partial<ResourceMap>;
  damage: number;
  fireInterval: number;
  range: number;
  ring: OrbitRing;
  /** Radians per second around the island. */
  orbitSpeed: number;
  /** Island HP repaired per second (repair sloop only). */
  repairRate?: number;
  color: string;
}

export interface Ship {
  uid: number;
  defId: ShipId;
  angle: number; // current orbit angle (radians)
  cooldown: number;
}

// ---------------------------------------------------------------------------
// Enemies
// ---------------------------------------------------------------------------
export type EnemyId = "raider" | "skiff" | "brute" | "captain";

export interface EnemyDef {
  id: EnemyId;
  name: string;
  baseHp: number;
  speed: number; // px/sec toward core
  armor: number; // flat damage reduction per hit
  damageToCore: number;
  radius: number;
  isBoss: boolean;
  /** Resource rewards on kill (before wave scaling for gold). */
  reward: Partial<ResourceMap>;
  color: string;
}

export interface Enemy {
  uid: number;
  defId: EnemyId;
  pos: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  slowUntil: number; // timestamp; while >now movement is slowed
  slowFactor: number;
  isBoss: boolean;
}

// ---------------------------------------------------------------------------
// Projectiles & transient effects (render + hit resolution)
// ---------------------------------------------------------------------------
export interface Projectile {
  uid: number;
  pos: Vec2;
  target: Vec2;
  speed: number;
  damage: number;
  splash: number;
  bossMultiplier: number;
  color: string;
  sourceTargetUid: number; // enemy aimed at
}

export interface Effect {
  pos: Vec2;
  radius: number;
  life: number;
  maxLife: number;
  color: string;
}

// ---------------------------------------------------------------------------
// Abilities
// ---------------------------------------------------------------------------
export type AbilityId = "barrage" | "rally" | "broadside" | "repairs";

export interface AbilityDef {
  id: AbilityId;
  name: string;
  desc: string;
  cost: Partial<ResourceMap>;
  cooldown: number;
  /** Whether the ability needs a target click on the battlefield. */
  targeted: boolean;
}

export interface AbilityState {
  cooldown: number; // remaining seconds
}

// ---------------------------------------------------------------------------
// Upgrades
// ---------------------------------------------------------------------------
export type UpgradeId =
  | "archerDmg"
  | "archerRange"
  | "cannonDmg"
  | "cannonRange"
  | "ballistaDmg"
  | "ballistaRange"
  | "watchtowerAura"
  | "shipDmg"
  | "shipRange"
  | "shipOrbit"
  | "shipReload"
  | "maxMana"
  | "manaRegen"
  | "goldGain";

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  desc: string;
  baseCost: Partial<ResourceMap>;
  costScaling: number; // multiplier per level
  maxLevel: number; // -1 = infinite
  /** Returns a human-readable current effect string for a given level. */
  effectLabel: (level: number) => string;
  unlock?: (state: GameSnapshot) => boolean;
}

// ---------------------------------------------------------------------------
// Dragons (MVP hook)
// ---------------------------------------------------------------------------
export interface DragonState {
  eggDiscovered: boolean;
  eggClaimed: boolean;
  trust: number;
}

// ---------------------------------------------------------------------------
// Snapshot exposed to React UI (read-only, throttled)
// ---------------------------------------------------------------------------
export interface GameSnapshot {
  resources: ResourceMap;
  maxMana: number;
  wave: number;
  waveActive: boolean;
  enemiesRemaining: number;
  islandHp: number;
  maxIslandHp: number;
  dps: number;
  timeSurvived: number;
  speed: number;
  autoAdvance: boolean;
  gameOver: boolean;
  bossWave: boolean;
  upgradeLevels: Record<UpgradeId, number>;
  shipsOwned: Record<ShipId, number>;
  towerCount: number;
  abilities: Record<AbilityId, AbilityState>;
  dragon: DragonState;
  armedAbility: AbilityId | null;
  bannerText: string | null;
  eventToast: { title: string; body: string } | null;
}
