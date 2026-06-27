import type { ShipDef, ShipId } from "../types";
import { STATUS } from "../config";

export const SHIP_DEFS: Record<ShipId, ShipDef> = {
  cutter: {
    id: "cutter",
    name: "Cutter",
    desc: "Fast orbit, low damage. Quick interception.",
    buildCost: { gold: 80, salvage: 25 },
    damage: 5,
    fireInterval: 0.6,
    range: 130,
    ring: "inner",
    orbitSpeed: 0.9,
    color: "#9fe0c0",
  },
  gunboat: {
    id: "gunboat",
    name: "Gunboat",
    desc: "Reliable broadsides. Fleet backbone.",
    buildCost: { gold: 140, salvage: 50 },
    damage: 14,
    fireInterval: 1.1,
    range: 160,
    ring: "middle",
    orbitSpeed: 0.55,
    color: "#e0a85c",
  },
  sloop: {
    id: "sloop",
    name: "Repair Sloop",
    desc: "Low damage. Slowly repairs the island.",
    buildCost: { gold: 100, salvage: 60 },
    damage: 2,
    fireInterval: 1.4,
    range: 120,
    ring: "inner",
    orbitSpeed: 0.7,
    repairRate: 1.2,
    color: "#7ec8e0",
  },

  // --- Phase 3 ship classes ---
  brigantine: {
    id: "brigantine",
    name: "Brigantine",
    desc: "Splash broadsides that catch clustered raiders.",
    buildCost: { gold: 220, salvage: 80 },
    damage: 18,
    fireInterval: 1.3,
    range: 175,
    ring: "middle",
    orbitSpeed: 0.5,
    color: "#e0c45c",
    splash: 45,
  },
  harpoonSchooner: {
    id: "harpoonSchooner",
    name: "Harpoon Schooner",
    desc: "Fast skirmisher whose hooks slow their target.",
    buildCost: { gold: 200, salvage: 70 },
    damage: 10,
    fireInterval: 1.0,
    range: 165,
    ring: "inner",
    orbitSpeed: 0.85,
    color: "#5fc0d8",
    appliesStatus: {
      id: "slow",
      duration: STATUS.slowDuration,
      magnitude: STATUS.slowFactor,
    },
  },
  ghostFrigate: {
    id: "ghostFrigate",
    name: "Ghost Frigate",
    desc: "Spectral shots that pass straight through armor.",
    buildCost: { gold: 300, salvage: 90, powder: 30 },
    damage: 22,
    fireInterval: 1.4,
    range: 185,
    ring: "middle",
    orbitSpeed: 0.45,
    color: "#b0a0e0",
    ignoreArmor: true,
  },
  manOWar: {
    id: "manOWar",
    name: "Dragonwake Man-o'-War",
    desc: "Capital ship. Fires a volley at several foes at once.",
    buildCost: { gold: 480, salvage: 160, powder: 60 },
    damage: 30,
    fireInterval: 2.0,
    range: 230,
    ring: "outer",
    orbitSpeed: 0.3,
    color: "#e07a4b",
    bossMultiplier: 1.4,
    volley: 3,
  },

  // --- Summon-only: Jasper Barrow's spectral aid (Phase 5 ally ability) ---
  ghostWarFrigate: {
    id: "ghostWarFrigate",
    name: "Jasper's Ghost War Frigate",
    desc: "Spectral capital ship summoned by Jasper Barrow. Fast, powerful, and shrugs off armor — but fades after a short time.",
    buildCost: {}, // never bought; conjured by the Ghost Frigate ability
    damage: 40,
    fireInterval: 0.7,
    range: 220,
    ring: "outer",
    orbitSpeed: 0.7,
    color: "#b9a8ff",
    ignoreArmor: true,
    bossMultiplier: 1.5,
    volley: 2,
    summonOnly: true,
  },
};

/** Fleet menu derives from SHIP_DEFS so new defs auto-appear in the UI.
 *  Summon-only ships (e.g. Jasper's Ghost War Frigate) are excluded — they are
 *  conjured by abilities, never recruited. */
export const BUILDABLE_SHIPS: ShipId[] = (
  Object.keys(SHIP_DEFS) as ShipId[]
).filter((id) => !SHIP_DEFS[id].summonOnly);
