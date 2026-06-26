# 🗺️ Tidehold — Implementation Plan & Progress Tracker

> **Central tracking document.** This is the single source of truth for the
> state of the build. Update the status markers, the Change Log, and the relevant
> task checkboxes **as work lands**. Keep it honest: a box is only checked when
> the code is merged and `npm run build` passes.

**How to use this doc**
- Each task has a status marker — update it when you start/finish work.
- Add a dated entry to the [Change Log](#-change-log) for every meaningful change.
- Keep the [Progress Dashboard](#-progress-dashboard) percentages in sync.
- Roadmap phases are ordered by dependency; do them roughly top-to-bottom.

**Status legend**

| Marker | Meaning |
| ------ | ------- |
| `[ ]`  | Not started |
| `[~]`  | In progress |
| `[x]`  | Done (merged, build passes) |
| `[!]`  | Blocked / needs decision |
| `[-]`  | Deferred / descoped |

---

## 📊 Progress Dashboard

| Area | Status | Notes |
| ---- | ------ | ----- |
| MVP core loop | ✅ Done | Towers, ships, waves, abilities, economy, save/load |
| Code-quality fixes (§A) | 🟨 In progress | A1/A2/A4/A5/A6/A7 done; A3/A8–A12 remain |
| Phase 1 — Foundations | ✅ Done | Status framework, unified damage pipeline, registry hygiene, save migration |
| Phase 2 — Towers & Magic Towers | ✅ Done | 3 standard + 5 magic towers, behavior flags, upgrades, renderer |
| Phase 3 — Fleet Expansion | ✅ Done | 4 new ship classes, behavior flags, outer-ring capital, save compat |
| Phase 4 — Dragon System | ✅ Done | 4 hatchable dragons (Blaze/Icey/Speedy/Elder), Trust-spend hatching, passive auras, Blaze Breath active ability, sanctuary roster UI, circling-dragon renderer |
| Phase 5 — Pirate King Factions | ✅ Done | 5 factions rotating by wave band, 10 faction enemies (swarm/armored/fast/healer/reward), faction bosses, regen + heal-aura behaviors, 2 counter-upgrades (Armor-Piercing, Tidal Nets), faction banner/topbar indicator |
| Phase 6 — Corruption & Crown Shard | ⬜ Not started | Risk/reward forbidden power |
| Phase 7 — Prestige | ⬜ Not started | `PrestigeManager`, meta-progression |
| Phase 8 — Captains, Resources, Automation | ⬜ Not started | Depth + idle systems |
| Phase 9 — UX & Interaction Polish | ✅ Done | 2× island + dual slot ring, circular HP gauge, click-to-upgrade towers, scrolling sea, Auto-Retry (current wave) + Next/Prev + target-wave |

> Update the emoji (⬜ → 🟨 in progress → ✅ done) as each area advances.

---

## 🧱 Current Architecture (reference)

```
src/game/
  GameEngine.ts        # orchestrates managers over a shared World; fixed-step loop
  world.ts             # mutable sim state
  bonuses.ts           # derives combat/economy values from upgrades + hatched-dragon auras
  config.ts            # tunables
  types.ts             # shared interfaces & id unions
  data/                # towers, ships, enemies, abilities, upgrades (plain objects)
  managers/            # ResourceManager, UpgradeManager, WaveManager, EnemyManager,
                       # TowerManager, ShipManager, ProjectileManager,
                       # AbilityManager, DragonManager
render/BattlefieldRenderer.ts
ui/                    # React panels + useEngine snapshot hook
```

**Extension points already in place**
- `Family = "land" | "sea" | "sky" | "shadow"` union (reserved for faction/upgrade grouping).
- Data-driven `*_DEFS` records → new content is a data entry, not engine code.
- Manager pattern → new systems slot in as new managers ticked by `GameEngine.step()`.
- `DragonState` + `DragonId`/`DRAGON_DEFS` → new dragons are a single data entry
  (id + def); abilities slot in via `DragonAbilityId`/`DRAGON_ABILITY_DEFS`.
- Versioned save (`SAVE_VERSION`) → migration path for schema growth.

---

## 🅰️ Section A — Code-Quality & Performance Backlog

Carried over from the implementation review. These should be cleared before (or
alongside) heavy roadmap content, because Phases 1–8 will multiply entity counts.

### High priority
- [x] **A1 — Throttle snapshot emission.** `GameEngine.tick()` now gates
  `buildSnapshot()/emit()` behind a `SNAPSHOT_INTERVAL` (0.1 s) accumulator
  (`snapshotTimer`); imperative `pushSnapshot()` still fires on user actions.
  _Files:_ `GameEngine.ts`.
- [x] **A2 — Cache effective tower range.** `TowerManager.computeRange()` runs
  once via `recomputeRanges()` (called from `build()` and `refreshDerived()`)
  and stores `tower.cachedRange`; `effectiveRange()` now reads the cache.
  _Files:_ `TowerManager.ts`, `GameEngine.ts`, `types.ts`.
- [ ] **A3 — Review repair-sloop stacking balance.** Linear stacking can outpace
  boss damage; consider a cap or diminishing returns. _Files:_ `ShipManager.ts`,
  `config.ts`.

### Medium priority
- [x] **A4 — Save migration.** `loadGame()` now runs a forward `MIGRATIONS`
  loop (keyed by old version, with a guard) instead of dropping on mismatch;
  `AnySave` carries the loosely-typed shape during migration. _Files:_ `save.ts`.
- [x] **A5 — Remove dead markers / stray re-exports.** Dropped `void w;` from
  `BattlefieldRenderer`, removed the `export { WAVE }` re-export from
  `GameEngine`, and `slotInfo()` now iterates `TOWER_SLOT_COUNT`.
  _Files:_ `BattlefieldRenderer.ts`, `AbilityManager.ts`, `GameEngine.ts`.
- [x] **A6 — Broadside uses real ship damage.** Broadside now reads
  `SHIP_DEFS[ship.defId].damage * shipDamageMult * broadsideDamageMult`.
  _Files:_ `AbilityManager.ts`.
- [x] **A7 — Ability effect positions use `CENTER`.** Rally/repairs effects use
  `CENTER` instead of the literal `(500,400)`. _Files:_ `AbilityManager.ts`.
- [ ] **A8 — In-place array compaction in hot loops** (only if profiling warrants).
  _Files:_ `ProjectileManager.ts`, `EnemyManager.ts`, `GameEngine.step`.

### Low priority
- [ ] **A9 — Game-over restart button** wired to `engine.reset()`. _Files:_ new/`App.tsx`, `ui/`.
- [ ] **A10 — Tower sell/refund** for partial resources. _Files:_ `TowerManager.ts`, `GameEngine.ts`, `UpgradePanel.tsx`.
- [ ] **A11 — Per-tower target priority** (first/strongest/boss). _Files:_ `TowerManager.ts`, `types.ts`, UI.
- [ ] **A12 — Introduce Vitest** and unit-test pure managers (wave scaling,
  upgrade cost, `computeBonuses`, armor math). _Files:_ `package.json`, `*.test.ts`.

---

## 🛤️ Roadmap Phases

Each phase lists **goal**, **dependencies**, **implementation steps grounded in
the current files**, and **acceptance criteria**. Content phases assume the
data-driven pattern: most new content is a definition + a small manager hook.

### Phase 1 — Foundations (unblocks all content)

**Goal:** Make adding towers/ships/enemies/statuses trivial and safe at scale.

- [x] **1.1 Status-effect framework.** `Enemy` now carries a `statuses:
  StatusInstance[]` list (`StatusId = burn | slow | stun | armorShred`).
  `EnemyManager.update` ticks burn DoT through `applyDamage`, drops expired
  statuses, and movement uses `moveFactor()` (stun→0, slow→min factor).
  Tunables live in `config.STATUS`. _Files:_ `types.ts`, `EnemyManager.ts`,
  `config.ts`, `combat.ts`.
- [x] **1.2 Damage pipeline.** New `combat.ts` exposes `applyDamage()`,
  `applyStatus()`, `moveFactor()`, `effectiveArmor()`. All damage sources
  (projectiles via `ProjectileManager.hit`, barrage in
  `AbilityManager.castBarrage`, burn DoT) route through `applyDamage`, so armor,
  armor-shred, rewards, mana-on-boss-kill, and `bossKills++` live in one place.
  _Files:_ `combat.ts`, `ProjectileManager.ts`, `AbilityManager.ts`,
  `EnemyManager.ts`.
- [x] **1.3 Content registry hygiene.** `BUILDABLE_TOWERS`/`BUILDABLE_SHIPS`
  now derive from `Object.keys(TOWER_DEFS)`/`Object.keys(SHIP_DEFS)`, so a new
  def auto-appears in the build/fleet menus (UpgradePanel already maps these
  lists). The `id` unions remain the typed source of truth for the `*_DEFS`
  records. Also removed the dead `slowUntil`/`slowFactor` fields from `Enemy`
  (superseded by `statuses` + `moveFactor`). _Files:_ `data/towers.ts`,
  `data/ships.ts`, `types.ts`, `EnemyManager.ts`.
- [x] **1.4 Save migration scaffold (depends on A4).** Landed via A4: forward
  `MIGRATIONS` loop in `loadGame()`, ready for `SAVE_VERSION` bumps. _Files:_
  `save.ts`.

**Acceptance:** ✅ a new enemy with a burn vulnerability and a new tower applying
burn can be added with zero changes to `GameEngine.step()` control flow — the
status framework + unified damage pipeline handle behavior, and registry-derived
`BUILDABLE_*` lists auto-wire the build/fleet UI.

### Phase 2 — Additional Towers & Magic Towers

**Goal:** Crossbow, Mortar, Harpoon + magic towers (Veilflame, Tide Engine,
Storm Spire, Frost Obelisk, Ember Shrine).

**Depends on:** Phase 1 (status effects, damage pipeline).

- [x] **2.1 Standard towers.** Added `crossbow` (pierces 3 enemies), `mortar`
  (range 320 / splash 70 / `minRange` 140), `harpoon` (single bolt, applies slow,
  `bossMultiplier` 1.3) to `TowerId` + `TOWER_DEFS`. `BUILDABLE_TOWERS` derives
  from `Object.keys(TOWER_DEFS)`, so they auto-appear. _Files:_ `types.ts`,
  `data/towers.ts`.
- [x] **2.2 Tower behavior flags.** `TowerDef` gained `pierceCount?`, `minRange?`,
  `appliesStatus?: StatusApplication`, `damageAura?`; `Projectile` gained
  `pierceCount?`/`status?`. `TowerManager.pickTarget` honors `minRange`;
  `damageAuraMult()` sums Ember-Shrine auras. `ProjectileManager` spawns with
  opts, pierces via `pickPierceTargets`, and applies status on hit through
  `applyStatus`. _Files:_ `types.ts`, `TowerManager.ts`, `ProjectileManager.ts`,
  `GameEngine.ts`.
- [x] **2.3 Magic towers (gold + powder).** Added Veilflame (burn), Frost
  Obelisk (slow + splash), Storm Spire (armor-shred + splash), Tide Engine (wide
  splash pulse), Ember Shrine (no attack; `damageAura` +25% to towers in range).
  Cost model resolved: **gold + powder** (no new `ResourceId`). _Files:_
  `data/towers.ts`, status framework.
- [x] **2.4 Upgrades + UI.** Added `crossbowDmg/Range`, `mortarDmg/Range`,
  `harpoonDmg/Range`, plus shared `magicDmg`/`magicPotency` to `UpgradeId`, `UP`,
  and `UPGRADE_DEFS`; folded into the Towers and Treasury & Magic upgrade groups.
  Generalized `bonuses.ts` `towerDamageMult`/`towerRangeFlat` to a
  convention-based `{id}Dmg`/`{id}Range` lookup that also applies magic upgrades
  to `MAGIC_TOWER_IDS` — new towers' upgrades auto-apply with no engine edits.
  _Files:_ `data/upgrades.ts`, `types.ts`, `bonuses.ts`.
- [x] **2.5 Renderer.** Distinct visuals come free from per-def `color` +
  name-initial glyph in `drawTowers`. `drawTowerRanges` now tints support-aura
  rings: damage auras (Ember Shrine) glow with the tower's own color, range auras
  (Watchtower) keep the cool blue. _Files:_ `BattlefieldRenderer.ts`.

**Acceptance:** ✅ all 8 new towers are buildable from the derived menu,
upgradable via convention-based bonuses, render distinctly (color + glyph + aura
tint), and apply their statuses through the shared pipeline; `npm run build`
passes with no special-casing in `GameEngine.step()`.

### Phase 3 — Fleet Expansion

**Goal:** Brigantine, Harpoon Schooner, Ghost Frigate, Dragonwake Man-o'-War.

**Depends on:** Phase 1; benefits from Phase 2 status framework.

- [x] **3.1 New ship defs.** Added `brigantine` (middle ring, splash 45),
  `harpoonSchooner` (inner, fast, slow-on-hit), `ghostFrigate` (middle, armor-
  piercing), `manOWar` (capital — the previously unused `outer` ring, 3-shot
  volley) to `ShipId` + `SHIP_DEFS`. `BUILDABLE_SHIPS` derives from the keys, so
  they auto-appear in the Fleet menu. _Files:_ `types.ts`, `data/ships.ts`.
- [x] **3.2 Special ship behaviors.** `ShipDef` gained `appliesStatus?`,
  `splash?`, `ignoreArmor?`, `bossMultiplier?`, `volley?`. `ShipManager` now
  fires at up to `volley` nearest targets via `pickTargets()`; the GameEngine
  ship-fire callback and the Full Broadside ability both pass splash/status/
  armor-pierce/boss-mult opts. Armor-pierce threads through `combat.applyDamage`
  via a new `DamageOptions.ignoreArmor` and `Projectile.ignoreArmor`. _Files:_
  `types.ts`, `ShipManager.ts`, `GameEngine.ts`, `AbilityManager.ts`,
  `combat.ts`, `ProjectileManager.ts`.
- [x] **3.3 Fleet upgrades + UI.** The existing Fleet upgrades (`shipDmg`,
  `shipRange`, `shipOrbit`, `shipReload`) are global multipliers in
  `computeBonuses`, so every new ship benefits automatically; the Fleet tab
  auto-renders `BUILDABLE_SHIPS` and `shipsOwned` tracks per-ship counts. No new
  per-ship upgrades were required. _Files:_ (none — existing convention covers it).
- [x] **3.4 Save compat.** `world.shipsOwned` now initializes from
  `Object.keys(SHIP_DEFS)` via `emptyShipCounts()`, so every `ShipId` (including
  new ones) defaults to 0 and round-trips through save/load and snapshots with no
  missing keys — no schema bump needed. _Files:_ `GameEngine.ts`.

**Acceptance:** ✅ all four new ships are recruitable from the derived Fleet menu,
orbit on their assigned rings (Man-o'-War on the outer ring), exhibit their
special behaviors (splash, slow-on-hit, armor-pierce, volley), benefit from the
global fleet upgrades, and persist across reload; `npm run build` passes.

### Phase 4 — Dragon System

**Goal:** Full dragon types (Blaze, Icey, Speedy, Elder) with hatch timers and
dragon abilities, expanding the current Trust-only hook.

**Depends on:** Phase 1 (status), Phase 2 (so dragon buffs interact with towers).

- [x] **4.1 Data model.** Added `DragonId = blaze | icey | speedy | elder`,
  `DragonDef`/`DragonAbilityDef` interfaces, and a new `data/dragons.ts`
  (`DRAGON_DEFS`, `DRAGON_LIST`, `DRAGON_ABILITY_DEFS`, `DRAGON_ABILITY_OWNER`).
  Extended `DragonState` with `hatched: DragonId[]` + `abilityCooldowns`, keeping
  `trust` as the sanctuary-wide spendable currency. _Files:_ `types.ts`,
  `data/dragons.ts`, `config.ts` (`DRAGON` tunables).
- [x] **4.2 Trust-spend hatching + auras.** _Design resolved:_ instead of real-time
  hatch timers, **Trust is spent to hatch** each dragon (per user decision).
  `DragonManager` earns Trust from bosses (`onBossDefeated`) and wave clears
  (`onWaveCleared`), and `hatch(id)` deducts the dragon's `hatchCost`. Passive
  auras fold into `computeBonuses`: Blaze = +tower damage, Icey = enemy-slow aura
  (applied in `EnemyManager.update` via `enemySlowMult`), Speedy = +fire rate
  (applied in `TowerManager.effectiveFireInterval` via `towerFireRateMult`),
  Elder = +a slice of all. _Files:_ `DragonManager.ts`, `bonuses.ts`,
  `EnemyManager.ts`, `TowerManager.ts`.
- [x] **4.3 Dragon abilities.** Added a parallel `DragonAbilityId = blazeBreath`
  with its own cooldown plumbing in `DragonManager` (`update(dt)` ticks
  cooldowns; `castAbility` checks unlock/cooldown/cost, then `castBlazeBreath`
  does an AoE `applyDamage` + burn `applyStatus`). `GameEngine` exposes
  `armDragonAbility`/`castDragonAbility`; targeted casts route through
  `onBattlefieldClick` (`armedDragonAbility`). _Files:_ `data/dragons.ts`,
  `DragonManager.ts`, `GameEngine.ts`, `types.ts`.
- [x] **4.4 Sanctuary UI.** Rewrote the Dragons tab: a Trust readout, a hatch
  roster (color dot + name + aura summary + Trust cost, disabled when owned or
  unaffordable), and a Blaze Breath ability button (cost + recharge state, armed
  highlight). _Files:_ `UpgradePanel.tsx` (DragonsTab/DragonAbilities).
- [x] **4.5 Renderer.** `drawDragons` draws each hatched dragon circling the
  island nursery at a staggered radius/phase with flapping wings; the armed-hint
  also fires for dragon abilities. _Files:_ `BattlefieldRenderer.ts`.

**Acceptance:** ✅ four dragons hatch by spending Trust, grant distinct passive
auras (tower damage / enemy slow / fire rate / all), and Blaze unlocks an active
AoE-burn ability; the sanctuary tab reflects roster + cooldown state, hatched
dragons circle the island, and saves persist via the v2→v3 migration.
`npm run build` passes.

### Phase 5 — The Five Pirate King Factions

**Goal:** Faction-themed enemies, mechanics, and counter-upgrades.

**Depends on:** Phases 1–2 (status/damage pipeline, counter mechanics).

- [x] **5.1 `FactionManager`.** New stateless manager that derives the active
  faction from the wave number — **rotating by wave band** (each block of
  `WAVE.bossEvery` waves is one faction, cycling `FACTION_ORDER`). It injects the
  faction's signature enemy into the spawn pool and supplies the band's boss.
  _Files:_ new `managers/FactionManager.ts`, new `data/factions.ts`,
  `GameEngine.ts` (constructs it, passes into `WaveManager`).
- [x] **5.2 Faction enemies.** Added 10 `EnemyId`s + `ENEMY_DEFS` — a signature
  + boss per faction: Crimson (swarmers), Ironhull (armored bulwarks),
  Stormcallers (fast skimmers), Drowned (self-heal menders + heal aura), Goldhand
  (reward-rich). Extended `EnemyDef` with `faction`, `regenPerSec`,
  `healAuraPerSec`/`healRadius`; honored via `EnemyManager.applyHealing()`.
  _Files:_ `types.ts`, `data/enemies.ts`, `EnemyManager.ts`.
- [x] **5.3 Faction waves & bosses.** `WaveManager.buildQueue` now pulls the
  active faction's boss (via `FactionManager.bossForWave`) and `pickNormal` draws
  from `SPAWN_POOL` + the faction signature entry. Boss HP scaling keys off
  `EnemyDef.isBoss` (not a hardcoded id). _Files:_ `WaveManager.ts`.
- [x] **5.4 Counter-upgrades.** Two new upgrades whose effect is applied by every
  **tower** hit (via a `fromTower` projectile flag + `world.bonuses`):
  Armor-Piercing Munitions (`armorShred` status, counters Ironhull) and Tidal
  Nets (`slow` status, counters Stormcallers). _Files:_ `data/upgrades.ts`,
  `bonuses.ts`, `ProjectileManager.ts`, `GameEngine.ts`, `types.ts`.
- [x] **5.5 UI.** TopBar shows a "Pirate King" chip (faction-coloured, counter
  hint on hover); WaveBanner tints to the faction colour and prints the counter
  hint; band-start + faction-boss banners announce the active Pirate King.
  _Files:_ `TopBar.tsx`, `WaveBanner.tsx`, `GameEngine.ts`.

**Acceptance:** ✅ five factions with distinct enemies/bosses, two working
counter-upgrades, and visible faction indication (topbar + banner).

### Phase 6 — Corruption & Crown Shard

**Goal:** Forbidden risk/reward power: large bonuses with escalating downsides.

**Depends on:** Phases 1, 5 (corruption modifies enemies/economy).

- [ ] **6.1 `CorruptionManager`.** Tracks a corruption meter; applies global
  modifiers (e.g., +damage/+gold but tougher/faster enemies). _Files:_ new
  manager, `GameEngine.ts`, `world.ts`.
- [ ] **6.2 Crown Shard upgrade/ability.** A gated, powerful effect that raises
  corruption when used. _Files:_ `data/abilities.ts` or `data/upgrades.ts`.
- [ ] **6.3 Feedback.** Visual corruption state (tinted sea, warning UI). _Files:_
  `BattlefieldRenderer.ts`, `TopBar.tsx`.
- [ ] **6.4 Save.** Persist corruption level. _Files:_ `save.ts`, migration.

**Acceptance:** corruption changes both power and threat measurably and is
visible to the player; persists.

### Phase 7 — Prestige ("Sanctuary Evacuation")

**Goal:** Reset run for persistent meta-currency and permanent upgrades.

**Depends on:** Phases 1–4 (enough depth to make resets meaningful).

- [ ] **7.1 `PrestigeManager`.** Computes meta-currency from run performance
  (waves cleared, bosses, trust). _Files:_ new manager, `GameEngine.ts`.
- [ ] **7.2 Evacuation flow.** A reset that wipes the run but banks meta-currency
  and keeps a meta-upgrade tree. Reuse `engine.reset()` plumbing, but preserve a
  separate meta save key. _Files:_ `save.ts` (new key), `GameEngine.ts`.
- [ ] **7.3 Meta-upgrade tree + UI.** New panel/tab for permanent upgrades that
  feed `computeBonuses`. _Files:_ `bonuses.ts`, new UI panel.

**Acceptance:** evacuating grants meta-currency, applies a permanent bonus to the
next run, and survives reload.

### Phase 8 — Captains, Additional Resources, Automation

**Goal:** Player captains, more resources, idle/automation upgrades.

**Depends on:** Phases 1–7 (slots into the mature economy).

- [ ] **8.1 New resources.** Extend `ResourceId` (e.g., a magic resource for
  magic towers, a sanctuary resource for dragons). Touches `ResourceMap`,
  `ResourceBar`, costs. _Files:_ `types.ts`, `config.ts`, `costUtil.tsx`.
- [ ] **8.2 Captains.** Selectable captain with passive + active perks feeding
  `computeBonuses`. _Files:_ new `data/captains.ts`, `bonuses.ts`, UI.
- [ ] **8.3 Automation.** Auto-build, auto-upgrade, auto-cast toggles for idle
  play. _Files:_ `GameEngine.ts`, UI toggles.

**Acceptance:** at least one new resource in active use, a selectable captain
with a real effect, and one automation toggle that works while idle.

### Phase 9 — UX & Interaction Polish

**Goal:** Make the battlefield bigger and more legible, and the controls more
tactile: a larger island with a second (inner) ring of tower slots, a circular
HP bar around the shoreline, clickable build slots, animated sea, richer wave
controls, and per-tower upgrades on click.

**Depends on:** Phases 1–3 (towers/ships/waves exist). Independent of Phases 4–8;
can land in parallel. Idea **9.5** changes the save schema → `SAVE_VERSION` bump.

- [x] **9.1 Larger island + dual tower ring + circular HP bar.** Roughly double
  the island footprint and add a **second, inner** ring of build slots so the
  layout reads as two concentric arcs of slots. Replace the green↔red shoreline
  stroke with a **circular progress arc** that sweeps from full to empty as
  island HP drops (clear arc + subtle color shift, not just a two-tone swap).
  _Grounded steps:_
    - `config.ts`: increase `ISLAND_RADIUS` (~70→~140) and rescale dependent
      radii so orbits/spawns stay outside the bigger island — bump
      `TOWER_RING_RADIUS` (outer slot ring) and add `TOWER_RING_INNER_RADIUS`;
      raise `ORBIT_RADII` (inner/middle/outer) and `SPAWN_RADIUS` proportionally.
      Add `TOWER_SLOT_RING_COUNTS` (or split `TOWER_SLOT_COUNT` into inner/outer)
      so total slots = inner + outer.
    - `TowerManager.slotPos(index)`: map a flat slot index onto the two rings
      (e.g. first N = outer ring, next M = inner ring) using the per-ring radius;
      keep `occupiedSlots`/`slotInfo()` index-based so the UI is unchanged in API.
    - `BattlefieldRenderer.drawIsland`: replace the hp-threshold stroke with an
      `arc()` HP gauge (start at top, sweep `2π·hpFrac`); keep a faint full-circle
      track underneath. Draw both slot rings in `drawSlots`.
  _Files:_ `config.ts`, `managers/TowerManager.ts`, `render/BattlefieldRenderer.ts`,
  possibly `GameEngine.slotInfo`.
- [x] **9.2 Clickable build-slot "+" interaction.** Clicking a slot's "+" should
  let the player choose which tower to place there (instead of only working when a
  tower is pre-selected in the panel). _Grounded steps:_
  _Shipped:_ kept the pre-select-then-click-slot placement path, and added
  click-to-select on placed towers (`engine.towerAt` → `selectTower`) feeding the
  new `TowerDetailPanel`; selected towers get a highlight ring in the renderer.
    - Add a lightweight selected-slot state (App/GameCanvas) set on slot click;
      surface a small build menu (reuse the Towers list from `UpgradePanel`/
      `BUILDABLE_TOWERS`) anchored to that slot or in the side panel.
    - On choice, call existing `engine.buildTower(defId, slotIndex)`; clear the
      selected slot. Keep the current "pre-selected tower + click slot" path as a
      fast alternative.
  _Files:_ `ui/GameCanvas.tsx`, `ui/App.tsx`, a small `SlotBuildMenu` (or reuse
  `UpgradePanel` Towers tab), `render/BattlefieldRenderer.ts` (highlight selected slot).
- [x] **9.3 Scrolling sea waves.** Add simple animated wave lines/bands drifting
  across the sea for life. _Grounded steps:_
    - `BattlefieldRenderer.drawSea`: draw a few sine/offset wave strokes whose
      phase advances with a time accumulator (renderer already receives frame
      time via the render loop; thread `dt`/`world.time` if needed). Purely
      cosmetic — no sim state, no save impact.
  _Files:_ `render/BattlefieldRenderer.ts` (+ maybe pass `world.time`).
- [x] **9.4 Richer wave controls.** Extend `SpeedControls` with: **Auto-Retry**
  (on game-over, auto-reset and restart), **Next/Previous wave** (only enabled
  when the current wave is finished/inactive), and a **target-wave number input**
  that auto-advances up to a chosen wave. _Grounded steps:_
  _Shipped:_ Auto-Retry performs a **soft restart of the current (highest) wave**
  — it keeps towers/ships/upgrades, restores island HP, clears the field, and
  replays the wave — so players can farm their best wave for gold (per user
  feedback) rather than restarting from wave 1. `targetWave` (0 = endless) gates
  auto-advance via `onWaveCleared`; `canStepWave` (`!waveActive && !gameOver`)
  enables the ◀/▶ stepping. No full page reload is used.
    - `WaveManager`: add `setWave(n)` / `jumpToWave(n)` (clamp ≥1) and a
      `targetWave?` for auto-advance-until; `prevWave()` decrements when inactive.
      Reuse `startNextWave()` for "Next".
    - `GameEngine`: public `nextWave()`, `prevWave()`, `setTargetWave(n)`,
      `toggleAutoRetry()`; on game-over, if auto-retry, `reset()` + resume.
    - `GameSnapshot`: add `autoRetry`, `targetWave`, and a `canStepWave`
      (true when `!waveActive && !gameOver`).
    - `SpeedControls.tsx`: render the toggle, ◀/▶ buttons (disabled per
      `canStepWave`), and a numeric `<input>` bound to `setTargetWave`.
  _Files:_ `managers/WaveManager.ts`, `GameEngine.ts`, `types.ts` (GameSnapshot),
  `ui/SpeedControls.tsx`.
- [x] **9.5 Per-tower upgrades on click.** Clicking a placed tower opens a detail
  panel to upgrade **that tower** (damage/range/fire-rate levels), independent of
  the global upgrade tree. _Grounded steps:_
    - `types.ts`: add per-tower upgrade state to `Tower` (e.g.
      `levels: { dmg: number; range: number; rate: number }`).
    - `TowerManager`: `upgradeTower(uid, kind)` with an **escalating gold +
      salvage** cost curve per level; fold per-tower levels into `computeRange()`
      and the per-shot damage/fire-interval reads (so the cached-range path stays
      correct).
    - `GameEngine`: `upgradeTower(uid, kind)`, `towerAt(point)` hit-test for
      click selection; expose selected-tower info to the snapshot.
    - `ui`: a `TowerDetailPanel` shown when a placed tower is selected (reuses
      the existing `selectedTower`/click plumbing in `App.tsx`/`GameCanvas.tsx`).
    - `save.ts`: **bump `SAVE_VERSION`** and add a migration that backfills
      default `levels` on towers from older saves.
  _Files:_ `types.ts`, `managers/TowerManager.ts`, `GameEngine.ts`,
  `ui/GameCanvas.tsx`, `ui/App.tsx`, new `ui/TowerDetailPanel.tsx`, `save.ts`.

**Acceptance:** the island is visibly larger with two usable slot rings and a
circular HP gauge; clicking an empty slot lets you pick & place a tower; the sea
animates; wave controls expose Auto-Retry, Next/Previous (gated on wave-finished),
and a target-wave input that auto-advances; clicking a placed tower upgrades that
specific tower and the per-tower levels persist across reload (with the
`SAVE_VERSION` migration). `npm run build` passes.

---

## ✅ Definition of Done (per task)

A task is `[x]` only when **all** hold:
1. Code merged and `npm run build` passes (strict `tsc` + Vite).
2. New content is data-driven (no special-casing in `GameEngine.step` unless a
   new system genuinely requires it).
3. Save/load round-trips the new state (with a `SAVE_VERSION` bump + migration if
   the schema changed).
4. The [Change Log](#-change-log) and [Progress Dashboard](#-progress-dashboard)
   are updated.

---

## 📓 Change Log

> Newest first. One entry per meaningful change. Format: `YYYY-MM-DD — area — summary`.

- 2026-06-26 — engine/ui — Implemented **Phase 5 — The Five Pirate King
  Factions**. Resolved the faction-selection decision as **rotating by wave
  band** (`band = floor((wave-1) / WAVE.bossEvery) % FACTION_ORDER.length`),
  cycling crimson → ironhull → stormcallers → drowned → goldhand so each 25-wave
  band culminates in that faction's boss. Added `FactionId`/`FactionDef` types, a
  data-driven `data/factions.ts` (`FACTION_DEFS` + `FACTION_ORDER`), and a
  stateless `FactionManager` (derives the active faction purely from
  `WaveManager.wave`). `WaveManager` now injects each faction's **signature
  enemy** into the spawn pool and pulls the band boss from the faction; boss-HP
  scaling generalized from a hardcoded `"captain"` check to `EnemyDef.isBoss`.
  Added **10 faction enemies** (`crimsonSwarmer`/`crimsonReaver`,
  `ironhullBulwark`/`ironhullDreadnought`, `stormSkimmer`/`stormHerald`,
  `drownedMender`/`drownedLeviathan`, `goldhandFactor`/`goldhandKingpin`) with new
  behavior flags honored by `EnemyManager.applyHealing` — `regenPerSec` (self-heal)
  and `healAuraPerSec`/`healRadius` (Drowned menders heal nearby allies). Added two
  **counter-upgrades** (`armorPiercing` → Armor-Piercing Munitions vs Ironhull;
  `tidalNets` → Tidal Nets vs Stormcallers) that fold into `computeBonuses`
  (`counterArmorShred`/`counterSlowFactor`, `COUNTER_STATUS` tunables) and apply as
  global tower-hit statuses via a new `fromTower` projectile flag in
  `ProjectileManager.hit` (ships excluded). Surfaced the active faction in the UI:
  a faction-coloured **Pirate King** chip in `TopBar` (counter hint on hover) and a
  faction-tinted `WaveBanner` with the counter hint as sub-text; `GameEngine`
  emits `activeFaction` in the snapshot and shows band-start/boss banners.
  `npm run build` passes.
- 2026-06-26 — engine/ui — Implemented **Phase 4 — Dragon System**. Added four
  hatchable dragons (`DragonId` Blaze/Icey/Speedy/Elder) in a new `data/dragons.ts`,
  with `DRAGON` config tunables (hatch costs, aura magnitudes, ability tuning) and
  extended `DragonState` (`hatched[]`, `abilityCooldowns`). **Trust-spend hatching**
  (per user decision — no real-time timers): `DragonManager` earns Trust from
  bosses + wave clears and `hatch(id)` deducts the dragon's cost. Passive auras
  fold into `computeBonuses` — Blaze=+tower damage, Icey=enemy slow (applied in
  `EnemyManager` via `enemySlowMult`), Speedy=+fire rate (applied in
  `TowerManager.effectiveFireInterval` via `towerFireRateMult`), Elder=+a slice of
  all. Added the **Blaze Breath** active ability (`DragonAbilityId`) with its own
  cooldown plumbing in `DragonManager` (AoE `applyDamage` + burn `applyStatus`),
  wired into `GameEngine` (`armDragonAbility`/`castDragonAbility`, `armedDragonAbility`
  routed through `onBattlefieldClick`). Rewrote the Dragons tab (Trust readout,
  hatch roster, ability button) and added `drawDragons` (hatched dragons circle the
  island with flapping wings). Bumped `SAVE_VERSION` 2→3 with a v2→v3 migration
  backfilling `hatched`/`abilityCooldowns`. `npm run build` passes.
- 2026-06-26 — ui — Popup/overlay polish: build & tower-detail popups are now
  edge-aware (clamped fully on-screen via `useClampedPosition`) and **scrollable**
  (`.tower-popup` flex column with `max-height` + `.tower-popup-body { overflow-y:
  auto }`); build-menu rows are cleaner (color dot + name + cost, description
  removed). `npm run build` passes.
- 2026-06-26 — engine/ui — Implemented **Phase 9 — UX & Interaction Polish**.
  **9.1:** doubled the island (`ISLAND_RADIUS` 70→140), added a second inner ring
  of build slots (`TOWER_SLOT_OUTER_COUNT` 8 + `TOWER_SLOT_INNER_COUNT` 6 = 14),
  rescaled orbit/spawn radii, and replaced the two-tone shoreline with a circular
  HP gauge (faint track + sweeping arc, green→amber→red). **9.2/9.5:** clicking a
  placed tower selects it (highlight ring) and opens a new `TowerDetailPanel` with
  three independent upgrade tracks (damage/range/fire-rate) on a `Tower.levels`
  schema, paid in escalating **gold + salvage**; per-tower levels fold into
  `computeRange`, `perTowerDamageMult`, and `effectiveFireInterval`. **9.3:**
  cosmetic scrolling sea-swell rings driven by `world.time`. **9.4:** richer wave
  controls — **Auto-Retry soft-restarts the current (highest) wave** to farm gold
  (keeps towers/ships/upgrades, restores HP, clears the field; no page reload),
  plus ◀/▶ Next/Prev (gated on `canStepWave`) and a target-wave input (0 = endless)
  that stops auto-advance. Bumped `SAVE_VERSION` 1→2 with a migration backfilling
  `levels`/`autoRetry`/`targetWave`. `npm run build` passes.
- 2026-06-26 — docs — Expanded the plan with **Phase 9 — UX & Interaction Polish**
  capturing five new feature ideas: (9.1) ~2× larger island with a second inner
  ring of tower slots and a circular HP progress-arc shoreline; (9.2) clickable
  build-slot "+" interaction to pick & place a tower; (9.3) animated scrolling sea
  waves; (9.4) richer wave controls (Auto-Retry, Next/Previous gated on
  wave-finished, target-wave auto-advance input); (9.5) per-tower upgrades on click
  with a new `Tower.levels` schema (+`SAVE_VERSION` bump/migration). Added a
  Dashboard row and an Open Decision for the per-tower upgrade/cost model and island
  rescale factor.
- 2026-06-23 — engine — Completed Phase 3 (Fleet Expansion): added Brigantine
  (splash), Harpoon Schooner (slow-on-hit), Ghost Frigate (armor-piercing), and
  the Dragonwake Man-o'-War (capital ship on the previously unused outer ring with
  a 3-shot volley). Extended `ShipDef` with `appliesStatus`/`splash`/`ignoreArmor`/
  `bossMultiplier`/`volley` flags; `ShipManager` fires volleys via `pickTargets`,
  and both the live ship loop and Full Broadside honor the flags. Threaded
  armor-pierce through `combat.applyDamage` (`DamageOptions.ignoreArmor`,
  `Projectile.ignoreArmor`). `shipsOwned` now initializes from `SHIP_DEFS` keys
  (`emptyShipCounts`) so new ids default to 0 and save/load round-trips cleanly.
  Existing global fleet upgrades apply to all new ships. Build passes.
- 2026-06-23 — engine — Completed Phase 2 (Towers & Magic Towers): added 3
  standard towers (crossbow=pierce, mortar=long-range/min-range, harpoon=slow)
  and 5 magic towers (Veilflame=burn, Frost Obelisk=slow, Storm Spire=shred,
  Tide Engine=splash, Ember Shrine=damage-aura support), all gold+powder for
  magic. Extended `TowerDef`/`Projectile` with behavior flags and honored them in
  `TowerManager`/`ProjectileManager` (pierce, minRange, status-on-hit, damage
  aura). Added per-tower + shared magic upgrades and generalized `bonuses.ts` to a
  convention-based `{id}Dmg`/`{id}Range` lookup (magic upgrades apply to
  `MAGIC_TOWER_IDS`). Renderer tints support-aura rings by type. Build passes.
  Cost-model open decision resolved (gold + powder, no new resource).
- 2026-06-23 — engine — Completed Phase 1 (Foundations): 1.3 registry hygiene —
  `BUILDABLE_TOWERS`/`BUILDABLE_SHIPS` now derive from `*_DEFS` keys so new defs
  auto-appear in the UI; removed dead `slowUntil`/`slowFactor` from `Enemy` (now
  fully replaced by `statuses` + `moveFactor`). Build passes. Phase 1 marked done.
- 2026-06-23 — engine — Implemented §A backlog A1/A2/A4/A5/A6/A7 and Phase 1.1/1.2/1.4:
  snapshot throttling (`SNAPSHOT_INTERVAL`), cached tower range
  (`recomputeRanges`), save-migration scaffold (`MIGRATIONS`), dead-marker
  cleanup + `TOWER_SLOT_COUNT`, real broadside damage, `CENTER`-based effects,
  status-effect framework (`Enemy.statuses`, `config.STATUS`), and a unified
  `combat.ts` damage pipeline (`applyDamage`/`applyStatus`/`moveFactor`/
  `effectiveArmor`) that all damage sources now route through. Build passes.
- 2026-06-23 — docs — Expanded ImplementationPlan into a central living tracker:
  added status legend, progress dashboard, code-quality backlog (Section A), and
  detailed Phase 1–8 roadmap steps grounded in the current files.
- 2026-06-23 — docs — Initial implementation review & suggestions documented.
- (earlier) — build — MVP vertical slice completed; strict build passing.

---

## 🧭 Open Decisions (resolve before the dependent phase)

- [x] **Magic-tower cost model** (Phase 2/8): ~~reuse powder, or introduce a new
  "essence"/mana-crystal resource?~~ **Resolved:** magic towers cost **gold +
  powder** (no new `ResourceId`). A dedicated magic resource may still be
  introduced later in Phase 8 (8.1) if desired.
- [x] **Dragon data shape** (Phase 4): ~~single evolving sanctuary vs. a roster of
  individual dragons.~~ **Resolved:** a **roster of four** named dragons
  (Blaze/Icey/Speedy/Elder), each hatched by **spending Trust** (no real-time
  timers), each granting a distinct passive aura; Blaze also unlocks the Blaze
  Breath active ability. New dragons are pure data (`DragonId` + `DRAGON_DEFS`).
- [x] **Faction selection** (Phase 5): ~~one faction per run, per region, or
  rotating by wave band?~~ Resolved → **rotating by wave band**. Each block of
  `WAVE.bossEvery` (25) waves is themed by one faction, cycling `FACTION_ORDER`,
  so a band always culminates in that faction's boss wave.
- [!] **Prestige currency source** (Phase 7): waves, bosses, trust, or a blend?
- [x] **Per-tower upgrade model** (Phase 9.5): ~~independent levels vs single
  tier; gold-only vs gold+salvage cost.~~ **Resolved:** three independent
  per-tower levels (`Tower.levels = { dmg, range, rate }`) stacking on top of the
  global upgrade tree, with an **escalating gold + salvage** cost per level.
  Requires a `SAVE_VERSION` bump + migration backfilling default `levels`.
- [x] **Island rescale factor** (Phase 9.1): ~~how aggressive the rescale is.~~
  **Resolved:** ~2× island — `ISLAND_RADIUS` 70→140, and **proportionally** raise
  `TOWER_RING_RADIUS` (+ new inner ring), `ORBIT_RADII` (inner/middle/outer), and
  `SPAWN_RADIUS` so the layout still fits the 1000×800 virtual viewport with both
  slot rings visible.
