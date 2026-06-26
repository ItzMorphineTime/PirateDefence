import type { FactionDef, FactionId } from "../types";

/**
 * The five Pirate King factions (Phase 5). The active faction rotates by wave
 * band — each block of WAVE.bossEvery waves is themed by one faction, cycling
 * through FACTION_ORDER. The faction biases the normal spawn pool toward its
 * `signatureEnemy` and supplies the boss for that band's boss wave.
 *
 * New factions are pure data: add an id to `FactionId`, an entry here, and the
 * signature enemy/boss to `ENEMY_DEFS`. The order they appear in below is the
 * rotation order.
 */
export const FACTION_DEFS: Record<FactionId, FactionDef> = {
  crimson: {
    id: "crimson",
    name: "Crimson Fleet",
    desc: "Blood-sailed swarmers that drown the shore in numbers.",
    color: "#ff3b54",
    family: "land",
    signatureEnemy: "crimsonSwarmer",
    signatureWeight: 14,
    signatureMinWave: 1,
    boss: "crimsonReaver",
    counterHint: "Splash & mortar fire shred the swarm.",
  },
  ironhull: {
    id: "ironhull",
    name: "Ironhull Armada",
    desc: "Slow, plated juggernauts that shrug off arrows.",
    color: "#8794a5",
    family: "sea",
    signatureEnemy: "ironhullBulwark",
    signatureWeight: 9,
    signatureMinWave: 1,
    boss: "ironhullDreadnought",
    counterHint: "Armor-Piercing Munitions cut through their plate.",
  },
  stormcallers: {
    id: "stormcallers",
    name: "Stormcaller Covenant",
    desc: "Fragile sky-strikers that blitz the island.",
    color: "#5fc4ff",
    family: "sky",
    signatureEnemy: "stormSkimmer",
    signatureWeight: 12,
    signatureMinWave: 1,
    boss: "stormHerald",
    counterHint: "Tidal Nets slow them; frost towers lock them down.",
  },
  drowned: {
    id: "drowned",
    name: "Drowned Court",
    desc: "Rotting menders that knit their kin back together.",
    color: "#34a596",
    family: "shadow",
    signatureEnemy: "drownedMender",
    signatureWeight: 8,
    signatureMinWave: 1,
    boss: "drownedLeviathan",
    counterHint: "Searing Rounds (burn) out-damage their regen.",
  },
  goldhand: {
    id: "goldhand",
    name: "Goldhand Syndicate",
    desc: "Bloated bankers — kill them for a fat purse.",
    color: "#ffcf4d",
    family: "land",
    signatureEnemy: "goldhandFactor",
    signatureWeight: 9,
    signatureMinWave: 1,
    boss: "goldhandKingpin",
    counterHint: "No gimmick — bring raw DPS and reap the bounty.",
  },
};

/** Rotation order: which faction governs wave band 0, 1, 2, ... */
export const FACTION_ORDER: FactionId[] = [
  "crimson",
  "ironhull",
  "stormcallers",
  "drowned",
  "goldhand",
];
