# 🐉 Tidehold: Dragonwake Defense

> A pirate-themed incremental island-defense game set in the **Shattered Seas** — build a cannon-covered fortress, surround it with a loyal fleet, rescue the last dragons, and survive endless waves from the Five Pirate Kings.

Tidehold blends **incremental progression**, **tower defense**, **fleet defense**, and **dragon-sanctuary** systems into a single dense, satisfying loop. Towers defend the land, ships circle the waters, mana abilities turn the tide, and every rescued dragon makes your sanctuary stronger.

This repository contains the **MVP prototype** — a fully playable vertical slice that proves the core loop and is architected for long-term expansion.

---

## ✨ Features

- **Canvas battlefield** — a large fortified island core, two concentric rings of **14 tower slots**, three orbit rings, a **circular HP gauge** around the shoreline, **scrolling sea swell**, enemies pouring in from the sea, projectiles, splash explosions, and live range circles.
- **Towers** — standard (Archer Nest, Cannon Battery, Ballista, Crossbow, Mortar, Harpoon), the range-extending Watchtower, and **magic towers** (Veilflame, Tide Engine, Storm Spire, Frost Obelisk, Ember Shrine) with status effects and support auras.
- **Per-tower upgrades** — click any placed tower to open its detail panel and level its **Damage / Range / Fire Rate** independently, paid in escalating Gold + Salvage.
- **Orbiting Ships** — Cutter, Gunboat, Repair Sloop, plus the Brigantine, Harpoon Schooner, Ghost Frigate, and the outer-ring Dragonwake Man-o'-War — all auto-firing as they circle.
- **4 Resources** — Gold, Salvage, Powder, and regenerating Mana.
- **4 Active Abilities** — Cannon Barrage (click-to-target), Rally the Crew, Full Broadside, and Emergency Repairs, each with resource costs and cooldowns.
- **Enemies** — Pirate Raider, Landing Skiff, Armored Brute, and the **Egg-Runner Captain** boss every 25 waves.
- **Endless scaling waves** — health, count, and rewards grow each wave; boss banners, speed controls (1× / 3× / 6×), auto-advance, **Auto-Retry** (restart your current/highest wave to farm gold), **Next/Previous** wave stepping, and a **target-wave** stop input.
- **Data-driven upgrades** across tabbed panels (Towers / Fleet / Magic / Dragons).
- **Dragon Sanctuary hook** — discover a hidden dragon egg at wave 5, claim it to begin the sanctuary, and earn **Dragon Trust** from boss kills for a permanent global tower-damage bonus.
- **Save / load** — versioned `localStorage` persistence with autosave and forward migrations; reload restores your entire run, including per-tower upgrade levels.

---

## 🎮 How to Play

1. **Build towers.** Select a tower from the **Towers** tab, then click a glowing `+` slot on either ring of the island.
2. **Upgrade individual towers.** Click any placed tower to open its detail panel and level its **Damage / Range / Fire Rate** for Gold + Salvage.
3. **Recruit ships.** In the **Fleet** tab, buy ships that orbit and defend the waters automatically.
4. **Upgrade everything globally.** Spend Gold, Salvage, and Powder on damage, range, fire rate, mana, and economy upgrades.
5. **Cast abilities.** Use mana-powered abilities at critical moments — bombard a lane, rally your defenders, or repair the island.
6. **Control the tide.** Use speed (1× / 3× / 6×), auto-advance, **Auto-Retry** to farm your highest wave, **◀/▶** to step waves between rounds, or set a **target wave** to stop at.
7. **Survive & scale.** Waves grow endlessly. A boss arrives every **25 waves**.
8. **Rescue the dragon.** Around **wave 5**, an egg appears. Claim it to begin the sanctuary and grow **Dragon Trust**.

> **Goal:** Beneath all the cannons, gold, and fire, the true objective remains — *protect the last dragons before the world drowns again.*

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ and npm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd DefendIsland/Claude

# Install dependencies
npm install

# Start the dev server (http://localhost:5173)
npm run dev
```

### Available Scripts

| Command           | Description                                        |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with hot-module reload   |
| `npm run build`   | Type-check (strict `tsc`) and build for production |
| `npm run preview` | Preview the production build locally               |

---

## 🛠️ Tech Stack

- **[React 18](https://react.dev/)** + **[TypeScript](https://www.typescriptlang.org/)** (strict mode) — UI panels
- **[Vite](https://vitejs.dev/)** — build tooling and dev server
- **HTML5 Canvas** — the real-time battlefield renderer (drawn independently of React for smooth performance)

The simulation runs on a **fixed-timestep game loop**. React UI subscribes to a throttled engine snapshot via `useSyncExternalStore`, so heavy entity rendering never triggers React re-renders.

---

## 🧱 Architecture

The codebase cleanly separates **pure game logic**, **canvas rendering**, and **React UI**.

```
src/
├── main.tsx                  # React entry point
├── App.tsx                   # Layout: canvas + panels; wires engine ↔ UI
├── game/
│   ├── GameEngine.ts         # Owns world state + fixed-timestep loop
│   ├── world.ts              # Shared mutable simulation state
│   ├── bonuses.ts            # Derives combat values from upgrades + dragon trust
│   ├── types.ts              # Shared interfaces & enums
│   ├── config.ts             # Tunable constants (scaling, costs, sizes)
│   ├── math.ts               # Vector/geometry helpers
│   ├── save.ts               # Versioned localStorage save/load
│   ├── data/                 # Data-driven definitions
│   │   ├── towers.ts
│   │   ├── ships.ts
│   │   ├── enemies.ts
│   │   ├── abilities.ts
│   │   └── upgrades.ts
│   └── managers/             # One responsibility each
│       ├── ResourceManager.ts
│       ├── UpgradeManager.ts
│       ├── WaveManager.ts
│       ├── EnemyManager.ts
│       ├── TowerManager.ts
│       ├── ShipManager.ts
│       ├── ProjectileManager.ts
│       ├── AbilityManager.ts
│       └── DragonManager.ts
├── render/
│   └── BattlefieldRenderer.ts  # Pure canvas; draws the world each frame
└── ui/
    ├── useEngine.ts          # Snapshot subscription hook
    ├── GameCanvas.tsx        # Canvas element, input handling
    ├── TopBar.tsx            # Wave / enemies / DPS / time / island HP
    ├── ResourceBar.tsx
    ├── UpgradePanel.tsx      # Tabbed Towers / Fleet / Magic / Dragons
    ├── TowerDetailPanel.tsx  # Per-tower upgrades for the selected tower
    ├── AbilityBar.tsx
    ├── SpeedControls.tsx     # Speed, auto-advance, Auto-Retry, wave stepping
    ├── WaveBanner.tsx
    └── EventToast.tsx        # Dragon egg / lore events
```

### Design principles
- **Data-driven content.** Towers, ships, enemies, abilities, and upgrades are plain definition objects — add new content without touching engine logic.
- **Manager pattern.** Each system is isolated and ticked by the engine, leaving clean seams for future `FactionManager`, `PrestigeManager`, and `CorruptionManager`.
- **Rendering decoupled from state.** The canvas reads world state each frame; React only renders panels from a throttled snapshot.

---

## ⚙️ Tuning

Most balance knobs live in [`src/game/config.ts`](src/game/config.ts):

```ts
WAVE.bossEvery          // boss cadence (default: every 25 waves)
WAVE.hpGrowth           // enemy HP scaling per wave (default: 1.18×)
DRAGON_EGG_WAVE         // when the egg event triggers (default: 5)
DRAGON_TRUST_DAMAGE_BONUS // +tower damage per Trust (default: +2%)
SPEED_OPTIONS           // available speed multipliers
```

Per-tower / ship / enemy / upgrade values live in the corresponding files under [`src/game/data/`](src/game/data/).

---

## 🗺️ Roadmap

The MVP is structured so these planned systems can be layered on:

- [x] Additional towers (Crossbow, Mortar, Harpoon) and **magic towers** (Veilflame, Tide Engine, Storm Spire, Frost Obelisk, Ember Shrine)
- [x] More ship classes (Brigantine, Harpoon Schooner, Ghost Frigate, Dragonwake Man-o'-War)
- [x] UX polish — larger dual-ring island, circular HP gauge, scrolling sea, per-tower upgrades, and richer wave controls (Auto-Retry / Next-Prev / target-wave)
- [ ] Full **dragon types** (Blaze, Icey, Speedy, Elder) with hatch timers and dragon abilities
- [ ] The **Five Pirate King** factions with unique enemies, mechanics, and counter-upgrades
- [ ] **Corruption** system and forbidden Crown Shard power
- [ ] **Prestige** ("Sanctuary Evacuation") with persistent meta-progression
- [ ] Player captains, additional resources, and automation upgrades

---

## 🌊 Lore

> The world was once balanced between **Land** (humans), **Sea** (Atlanteans), and **Sky** (dragons). That balance shattered when the Atlantean Pearl Synod tried to power a world-commanding engine — **The Crown Below** — with stolen dragon eggs. The ritual failed, the continents broke, and the seas turned hostile.
>
> You are a new captain who discovers a hidden **Tidehold**: a fortified island the Tidewardens use to shelter dragon eggs and resist the powers that broke the world. Your mission begins as survival. It becomes rescue. Eventually, it becomes repair.

The full worldbuilding document (`LORE.md`) is the narrative foundation for the
game — drop it into the project root to link it here.

---

*Built with cannons, gold, ghosts, and fire — for the last dragons.* 🐉
