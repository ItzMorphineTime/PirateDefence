// ============================================================================
// Shared types for Tidehold: Dragonwake Defense
// ============================================================================

export type ResourceId = "gold" | "salvage" | "powder" | "mana";

export type ResourceMap = Record<ResourceId, number>;

/** Family tags reserved for future Land/Sea/Sky/Shadow upgrade groupings. */
export type Family = "land" | "sea" | "sky" | "shadow";

// ---------------------------------------------------------------------------
// Factions (Phase 5 — the Five Pirate Kings)
// ---------------------------------------------------------------------------
/** The five Pirate King factions. The active faction rotates by wave band. */
export type FactionId =
  | "flameheart"
  | "thalassa"
  | "drakon"
  | "tideborn"
  | "goldwake";

export interface FactionDef {
  id: FactionId;
  name: string;
  /** Flavour line shown in the wave banner / topbar. */
  desc: string;
  /** Theme colour for banner accents. */
  color: string;
  /** Family lineage (used for thematic grouping). */
  family: Family;
  /** Faction enemy that gets weighted into the normal spawn pool. */
  signatureEnemy: EnemyId;
  /** Spawn weight for the signature enemy when this faction is active. */
  signatureWeight: number;
  /** Minimum wave before the signature enemy joins the pool. */
  signatureMinWave: number;
  /** Boss spawned on this faction's boss waves. */
  boss: EnemyId;
  /** One-line hint about which counter-upgrade helps most. */
  counterHint: string;
}

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

/** Per-tower upgrade kinds (independent of the global upgrade tree). */
export type TowerUpgradeKind = "dmg" | "range" | "rate";

/** Individual upgrade levels for a single placed tower (Phase 9.5). */
export interface TowerLevels {
  dmg: number;
  range: number;
  rate: number;
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
  /** Per-tower upgrade levels, bought by clicking the placed tower. */
  levels: TowerLevels;
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
  | "manOWar"
  | "ghostWarFrigate";

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
  /** Summon-only: not recruitable from the fleet menu (e.g. Jasper's spectral
   *  Ghost War Frigate, conjured by an ability for a limited time). */
  summonOnly?: boolean;
}

export interface Ship {
  uid: number;
  defId: ShipId;
  angle: number; // current orbit angle (radians)
  cooldown: number;
  /** Simulation timestamp (world.time) at which a summoned ship vanishes.
   *  Undefined for permanent recruited ships. */
  expiresAt?: number;
}

// ---------------------------------------------------------------------------
// Enemies
// ---------------------------------------------------------------------------
export type EnemyId =
  | "raider"
  | "skiff"
  | "brute"
  | "captain"
  // --- Phase 5 faction enemies (the Five Pirate Kings) ---
  | "ashSwarmer"
  | "flameheartReaver"
  | "tidalBulwark"
  | "thalassaLeviathan"
  | "serpentRacer"
  | "drakonHerald"
  | "abyssMender"
  | "tidebornKraken"
  | "goldwakeFactor"
  | "goldwakeKingpin";

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
  /** Faction this enemy belongs to (undefined = neutral starter pool). */
  faction?: FactionId;
  // --- Phase 5 behavior flags (all optional; absent = vanilla) ---
  /** Self-heal in HP/sec while alive (Drowned Court menders & leviathan). */
  regenPerSec?: number;
  /** Heals nearby allied enemies for this much HP/sec within healRadius. */
  healAuraPerSec?: number;
  healRadius?: number;
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
  /** Tower shots carry global faction counter-statuses (Phase 5). */
  fromTower?: boolean;
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
export type AbilityId =
  | "barrage"
  | "rally"
  | "broadside"
  | "repairs"
  | "crownShard"
  | "ghostFrigate";

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
  | "goldGain"
  // --- Phase 5 faction counter-upgrades ---
  | "armorPiercing"
  | "tidalNets";

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
// Prestige ("Sanctuary Evacuation") — permanent meta-upgrades bought with the
// Tideglass meta-currency, persisted separately so they survive a run reset.
// ---------------------------------------------------------------------------
export type MetaUpgradeId =
  | "metaEconomy" // starting gold + permanent gold multiplier
  | "metaDamage" // permanent global tower & ship damage multiplier
  | "metaFortitude" // higher starting & max island HP
  | "metaHeadstart"; // begin each run with global upgrade levels granted

export interface MetaUpgradeDef {
  id: MetaUpgradeId;
  name: string;
  desc: string;
  /** Tideglass cost of the first level. */
  baseCost: number;
  /** Geometric cost multiplier per level already owned. */
  costScaling: number;
  maxLevel: number; // -1 = infinite
  /** Human-readable effect string for the given level. */
  effectLabel: (level: number) => string;
}

/** Persistent meta-progression saved under the prestige key. */
export interface PrestigeState {
  /** Banked Tideglass available to spend on meta-upgrades. */
  tideglass: number;
  /** Highest wave ever reached across all runs (for display/records). */
  bestWave: number;
  /** Total number of evacuations performed. */
  evacuations: number;
  /** Purchased meta-upgrade levels. */
  meta: Record<MetaUpgradeId, number>;
}

// ---------------------------------------------------------------------------
// Dragons
// ---------------------------------------------------------------------------
/** The four hatchable dragon types, each granting a distinct passive aura. */
export type DragonId = "blaze" | "icey" | "speedy" | "elder";

/** Active dragon abilities (parallel to AbilityId; reuses cooldown plumbing). */
export type DragonAbilityId = "blazeBreath";

/** What kind of passive bonus a hatched dragon contributes. */
export type DragonAuraKind =
  | "towerDamage" // +% tower damage
  | "enemySlow" // global enemy speed reduction
  | "fireRate" // +% tower fire rate
  | "all"; // a smaller slice of every other aura

export interface DragonDef {
  id: DragonId;
  name: string;
  /** Short flavour line for the sanctuary roster. */
  desc: string;
  /** Display colour (renderer + UI accents). */
  color: string;
  /** Trust spent to hatch this dragon. */
  hatchCost: number;
  /** Passive aura kind + per-dragon magnitude. */
  aura: DragonAuraKind;
  auraMagnitude: number;
  /** Optional active ability unlocked once hatched. */
  ability?: DragonAbilityId;
}

/** Active dragon ability definition (mirrors AbilityDef, mana/powder cost). */
export interface DragonAbilityDef {
  id: DragonAbilityId;
  name: string;
  desc: string;
  cost: Partial<ResourceMap>;
  cooldown: number;
  /** Whether the ability needs a target click on the battlefield. */
  targeted: boolean;
}

export interface DragonState {
  eggDiscovered: boolean;
  eggClaimed: boolean;
  /** Spendable sanctuary currency (earned from bosses + base claim). */
  trust: number;
  /** Which dragon types have been hatched (trust spent). */
  hatched: DragonId[];
  /** Remaining cooldown per dragon ability (seconds). */
  abilityCooldowns: Record<DragonAbilityId, number>;
}

/** Per-upgrade-kind detail for the selected tower's detail panel. */
export interface SelectedTowerUpgrade {
  level: number;
  maxed: boolean;
  cost: Partial<ResourceMap>;
}

/** Live combat stats for the selected tower (computed, read-only display). */
export interface SelectedTowerStats {
  /** Effective per-shot damage (base × global × aura × per-tower). */
  damage: number;
  /** Seconds between shots after rate upgrades. */
  fireInterval: number;
  /** Shots per second (1 / fireInterval). */
  fireRate: number;
  /** Effective range (def + upgrades + auras). */
  range: number;
  /** Sustained single-target damage per second (damage × fireRate). */
  dps: number;
  /** Splash radius (0 = single target). */
  splash: number;
  /** Bonus damage multiplier vs bosses. */
  bossMultiplier: number;
  /** Status effect this tower applies, if any. */
  status?: StatusApplication;
  /** True for support towers (auras, no projectiles). */
  support: boolean;
}

/** Snapshot of the currently-selected placed tower (for the detail panel). */
export interface SelectedTowerInfo {
  uid: number;
  defId: TowerId;
  name: string;
  desc: string;
  slotIndex: number;
  stats: SelectedTowerStats;
  dmg: SelectedTowerUpgrade;
  range: SelectedTowerUpgrade;
  rate: SelectedTowerUpgrade;
  /** Resources returned if this tower is sold (50% of invested value). */
  sellValue: Partial<ResourceMap>;
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
  autoRetry: boolean;
  targetWave: number;
  canStepWave: boolean;
  gameOver: boolean;
  bossWave: boolean;
  /** Pirate King faction governing the current wave band. */
  activeFaction: FactionId;
  upgradeLevels: Record<UpgradeId, number>;
  shipsOwned: Record<ShipId, number>;
  towerCount: number;
  selectedTower: SelectedTowerInfo | null;
  abilities: Record<AbilityId, AbilityState>;
  dragon: DragonState;
  armedAbility: AbilityId | null;
  armedDragonAbility: DragonAbilityId | null;
  bannerText: string | null;
  eventToast: { title: string; body: string } | null;
  /** Crown Shard corruption meter (0..CORRUPTION.max). */
  corruption: number;
  /** Maximum corruption (for the UI gauge). */
  corruptionMax: number;
  /** Persistent prestige meta-progression (Tideglass + meta-upgrade levels). */
  prestige: PrestigeState;
  /** Tideglass that *would* be banked if the player evacuated right now. */
  pendingTideglass: number;
}
