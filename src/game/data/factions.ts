import type { FactionDef, FactionId } from "../types";

/**
 * The Pirate Kings of the Dragonwake (Phase 5). Four dragon-hunting Kings from
 * LORE.md raid the sanctuary; the fifth slot is the Goldwake Consortium, a
 * greedy merchant-pirate fleet that profits off the dragon-egg bounty economy.
 * (Jasper Barrow, the one King who *protects* dragons, is not an enemy — he
 * answers the player's call as a summonable Ghost War Frigate ability.)
 *
 * The active King rotates by wave band — each block of WAVE.bossEvery waves is
 * themed by one King, cycling through FACTION_ORDER. The King biases the normal
 * spawn pool toward its `signatureEnemy` and supplies the boss for that band's
 * boss wave.
 *
 * New factions are pure data: add an id to `FactionId`, an entry here, and the
 * signature enemy/boss to `ENEMY_DEFS`. The order they appear in below is the
 * rotation order.
 */
export const FACTION_DEFS: Record<FactionId, FactionDef> = {
  flameheart: {
    id: "flameheart",
    name: "Ashen Reach (Ebon Flameheart)",
    desc: "The Dragon Marauder's fire-swarm — countless ash-sailed raiders set the shore alight.",
    color: "#ff4d2e",
    family: "land",
    signatureEnemy: "ashSwarmer",
    signatureWeight: 14,
    signatureMinWave: 1,
    boss: "flameheartReaver",
    counterHint: "Splash & mortar fire shred the burning swarm.",
  },
  thalassa: {
    id: "thalassa",
    name: "Drowned Crown (Adara Thalassa)",
    desc: "The Queen of Leviathans sends plated juggernauts that shrug off arrows.",
    color: "#3f8aa5",
    family: "sea",
    signatureEnemy: "tidalBulwark",
    signatureWeight: 9,
    signatureMinWave: 1,
    boss: "thalassaLeviathan",
    counterHint: "Armor-Piercing Munitions cut through leviathan plate.",
  },
  drakon: {
    id: "drakon",
    name: "Coiled Expanse (Mordekai Drakon)",
    desc: "The Sea Serpent King's racers blitz the island faster than the eye can track.",
    color: "#5fd08a",
    family: "sky",
    signatureEnemy: "serpentRacer",
    signatureWeight: 12,
    signatureMinWave: 1,
    boss: "drakonHerald",
    counterHint: "Tidal Nets & frost lock the serpent racers down.",
  },
  tideborn: {
    id: "tideborn",
    name: "Black Spiral (Nimue Tideborn)",
    desc: "The Kraken Caller's abyssal spawn knit their rotting kin back together.",
    color: "#6a4fb0",
    family: "shadow",
    signatureEnemy: "abyssMender",
    signatureWeight: 8,
    signatureMinWave: 1,
    boss: "tidebornKraken",
    counterHint: "Searing burn DoT out-damages their abyssal regen.",
  },
  goldwake: {
    id: "goldwake",
    name: "Goldwake Consortium (Merchant King)",
    desc: "A self-made trade-baron's bounty fleet — bloated galleons, fat with plundered coin.",
    color: "#ffcf4d",
    family: "land",
    signatureEnemy: "goldwakeFactor",
    signatureWeight: 9,
    signatureMinWave: 1,
    boss: "goldwakeKingpin",
    counterHint: "No gimmick — bring raw DPS and reap the bounty.",
  },
};

/** Rotation order: which King governs wave band 0, 1, 2, ... */
export const FACTION_ORDER: FactionId[] = [
  "flameheart",
  "thalassa",
  "drakon",
  "tideborn",
  "goldwake",
];
