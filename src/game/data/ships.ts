import type { ShipDef, ShipId } from "../types";

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
};

export const BUILDABLE_SHIPS: ShipId[] = ["cutter", "gunboat", "sloop"];
