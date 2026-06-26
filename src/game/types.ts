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
export type TowerId =
  | "archer"
  | "cannon"
  | "ballista"
  | "watchtower"
  | "crossbow"
  | "mortar"
  | "harpoon"
  | "veilflame"
  | "frostObelisk"
  | "stormSpire"
  | "tideEngine"
  | "emberShrine";

/** Status payload a tower applies to enemies it hits. */
export interface StatusApplication {
  id: StatusId;
  /** Duration in seconds. */
  duration: number;
  /** Magnitude (burn dmg/sec, slow factor 0..1, armorShred flat). */
  magnitude: number;
}

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
  // --- Phase 2 behavior flags (all optional; absent = vanilla) ---
  /** Number of enemies a single-target shot pierces through (>=2 = pierce). */
  pierceCount?: number;
  /** Minimum engagement range; enemies closer than this are ignored. */
  minRange?: number;
  /** Status effect applied to enemies hit by this tower's projectiles. */
  appliesStatus?: StatusApplication;
  /** Support-only: flat damage-multiplier bonus granted to towers within
   *  auraRadius (e.g. Ember Shrine). Does not fire projectiles. */
  damageAura?: number;
}

export interface Tower {
  uid: number;
  defId: TowerId;
  pos: Vec2;
  slotIndex: number;
  cooldown: number; // time until next shot
  /** Cached effective range (def + upgrades + watchtower auras). Recomputed
   *  only when the tower roster or bonuses change, not every frame. */
  cachedRange: number;
}

// ---------------------------------------------------------------------------
// Ships
// ---------------------------------------------------------------------------
export type ShipId =
  | "cutter"
  | "gunboat"
  | "sloop"
  | "brigantine"
  | "harpoonSchooner"
  | "ghostFrigate"
  | "manOWar";

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
  // --- Phase 3 behavior flags (all optional; absent = vanilla) ---
  /** Status effect applied to enemies this ship's shots hit (Harpoon Schooner). */
  appliesStatus?: StatusApplication;
  /** Splash radius for the ship's shots (0/undefined = single target). */
  splash?: number;
  /** Shots ignore enemy armor entirely (Ghost Frigate). */
  ignoreArmor?: boolean;
  /** Bonus damage multiplier vs boss enemies. */
  bossMultiplier?: number;
  /** Fires this many shots per volley at distinct nearby targets (Man-o'-War). */
  volley?: number;
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

// --- Status effects (burn DoT, slow, stun, armor shred) ---
export type StatusId = "burn" | "slow" | "stun" | "armorShred";

export interface StatusInstance {
  id: StatusId;
  /** Simulation timestamp (world.time) at which this status expires. */
  until: number;
  /** Magnitude: burn = dmg/sec, slow = speed factor (0..1),
   *  armorShred = flat armor removed, stun = unused. */
  magnitude: number;
}

export interface Enemy {
  uid: number;
  defId: EnemyId;
  pos: Vec2;
  hp: number;
  maxHp: number;
  speed: number;
  isBoss: boolean;
  /** Active status effects (slow/stun/burn/armorShred); ticked/expired in
   *  EnemyManager. Replaces the former slowUntil/slowFactor pair. */
  statuses: StatusInstance[];
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
  /** Enemies a single-target shot pierces through (default 1). */
  pierceCount?: number;
  /** Status applied to each enemy this projectile hits. */
  status?: StatusApplication;
  /** If true, this shot bypasses enemy armor (Ghost Frigate). */
  ignoreArmor?: boolean;
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
  | "crossbowDmg"
  | "crossbowRange"
  | "mortarDmg"
  | "mortarRange"
  | "harpoonDmg"
  | "harpoonRange"
  | "shipDmg"
  | "shipRange"
  | "shipOrbit"
  | "shipReload"
  | "magicDmg"
  | "magicPotency"
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
