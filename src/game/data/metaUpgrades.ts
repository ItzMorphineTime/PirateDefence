// ============================================================================
// Prestige ("Sanctuary Evacuation") meta-upgrades. Bought with Tideglass and
// persisted separately from a run, these grant permanent bonuses that apply at
// the start of — and throughout — every future run. Mirrors the data-driven
// shape of the in-run upgrades (data/upgrades.ts).
// ============================================================================
import type { MetaUpgradeDef, MetaUpgradeId } from "../types";

/** Per-level effect magnitudes (used for display *and* by bonuses.ts / engine). */
export const META = {
  /** +8% gold per level (permanent, multiplies the in-run gold multiplier). */
  economyGoldMult: 0.08,
  /** +40 starting gold per level (granted at run start). */
  economyStartGold: 40,
  /** +6% global tower & ship damage per level (permanent). */
  damageMult: 0.06,
  /** +30 starting & max island HP per level. */
  fortitudeHp: 30,
  /** Free global upgrade levels granted to every tower/ship damage line / level. */
  headstartUpgradeLevels: 1,
};

export const META_UPGRADE_DEFS: Record<MetaUpgradeId, MetaUpgradeDef> = {
  metaEconomy: {
    id: "metaEconomy",
    name: "Tidewardens' Treasury",
    desc: "Begin each run with bonus gold, and earn permanently more gold.",
    baseCost: 2,
    costScaling: 1.6,
    maxLevel: -1,
    effectLabel: (l) =>
      `+${l * META.economyStartGold} start gold, +${Math.round(
        l * META.economyGoldMult * 100
      )}% gold`,
  },
  metaDamage: {
    id: "metaDamage",
    name: "Ancestral Armaments",
    desc: "Permanently boost all tower & ship damage in every future run.",
    baseCost: 3,
    costScaling: 1.7,
    maxLevel: -1,
    effectLabel: (l) => `+${Math.round(l * META.damageMult * 100)}% damage`,
  },
  metaFortitude: {
    id: "metaFortitude",
    name: "Deepstone Foundations",
    desc: "Raise the island's starting and maximum HP for every run.",
    baseCost: 2,
    costScaling: 1.6,
    maxLevel: -1,
    effectLabel: (l) => `+${l * META.fortitudeHp} island HP`,
  },
  metaHeadstart: {
    id: "metaHeadstart",
    name: "Veteran Crew",
    desc: "Start each run with free levels in the core damage upgrades.",
    baseCost: 4,
    costScaling: 2.0,
    maxLevel: 5,
    effectLabel: (l) =>
      `+${l * META.headstartUpgradeLevels} free dmg upgrade level${
        l === 1 ? "" : "s"
      }`,
  },
};

export const META_UPGRADE_LIST: MetaUpgradeId[] = [
  "metaEconomy",
  "metaDamage",
  "metaFortitude",
  "metaHeadstart",
];
