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
| Code-quality fixes (§A) | ⬜ Not started | Perf + cleanup backlog from review |
| Phase 1 — Foundations | ⬜ Not started | Refactors that unblock all roadmap content |
| Phase 2 — Towers & Magic Towers | ⬜ Not started | New `TowerId`s + status effects |
| Phase 3 — Fleet Expansion | ⬜ Not started | New ship classes + ring behaviors |
| Phase 4 — Dragon System | ⬜ Not started | Dragon types, hatch timers, dragon abilities |
| Phase 5 — Pirate King Factions | ⬜ Not started | `FactionManager`, faction waves & counters |
| Phase 6 — Corruption & Crown Shard | ⬜ Not started | Risk/reward forbidden power |
| Phase 7 — Prestige | ⬜ Not started | `PrestigeManager`, meta-progression |
| Phase 8 — Captains, Resources, Automation | ⬜ Not started | Depth + idle systems |

> Update the emoji (⬜ → 🟨 in progress → ✅ done) as each area advances.

---

## 🧱 Current Architecture (reference)

```
src/game/
  GameEngine.ts        # orchestrates managers over a shared World; fixed-step loop
  world.ts             # mutable sim state
  bonuses.ts           # derives combat/economy values from upgrades + dragon trust
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
- `DragonState` + Dragon Trust hook → expandable into the full dragon system.
- Versioned save (`SAVE_VERSION`) → migration path for schema growth.

---

## 🅰️ Section A — Code-Quality & Performance Backlog

Carried over from the implementation review. These should be cleared before (or
alongside) heavy roadmap content, because Phases 1–8 will multiply entity counts.

### High priority
- [ ] **A1 — Throttle snapshot emission.** `GameEngine.tick()` calls
  `buildSnapshot()/emit()` every frame; gate it to a fixed UI cadence (~100 ms)
  with an accumulator, keeping imperative `pushSnapshot()` for user actions.
  _Files:_ `GameEngine.ts`.
- [ ] **A2 — Cache effective tower range.** `TowerManager.effectiveRange` is
  O(N²) and runs per-shot and per-render. Compute once in `refreshDerived()`
  and store on the tower (`tower.cachedRange`). _Files:_ `TowerManager.ts`,
  `GameEngine.ts`, `BattlefieldRenderer.ts`, `types.ts`.
- [ ] **A3 — Review repair-sloop stacking balance.** Linear stacking can outpace
  boss damage; consider a cap or diminishing returns. _Files:_ `ShipManager.ts`,
  `config.ts`.

### Medium priority
- [ ] **A4 — Save migration.** Replace "drop save on version mismatch" with a
  `migrate(save)` keyed by version. _Files:_ `save.ts`, `config.ts`.
- [ ] **A5 — Remove dead markers / stray re-exports.** `void w;`, `void ENEMY;`,
  `export { WAVE }` from `GameEngine.ts`, literal `8` → `TOWER_SLOT_COUNT`.
  _Files:_ `BattlefieldRenderer.ts`, `AbilityManager.ts`, `GameEngine.ts`.
- [ ] **A6 — Broadside uses real ship damage.** Replace the hardcoded `18` base
  with each ship's `def.damage * shipDamageMult`. _Files:_ `AbilityManager.ts`.
- [ ] **A7 — Ability effect positions use `CENTER`.** Replace literal `(500,400)`.
  _Files:_ `AbilityManager.ts`.
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

- [ ] **1.1 Status-effect framework.** Generalize the existing `slowUntil/slowFactor`
  on `Enemy` into a small status list (`burn`, `slow`, `stun`, `armorShred`).
  Add a `StatusManager` (or fold into `EnemyManager.update`) that ticks DoT and
  expirations. _Files:_ `types.ts` (extend `Enemy`), `EnemyManager.ts`, `config.ts`.
- [ ] **1.2 Damage pipeline.** Route all damage (towers, ships, abilities,
  DoT) through one `applyDamage(enemy, amount, opts)` helper so armor, shred,
  rewards, and `bossKills++` live in one place. _Files:_ new `combat.ts` or
  extend `ProjectileManager`; update `AbilityManager.castBarrage` to use it.
- [ ] **1.3 Content registry hygiene.** Convert `TowerId`/`ShipId`/`EnemyId`
  unions to be derived from the `*_DEFS` keys where possible, and ensure
  `BUILDABLE_*` lists drive UI so new entries auto-appear. _Files:_ `data/*`, UI.
- [ ] **1.4 Save migration scaffold (depends on A4).** Land the migration system
  first so every later phase bumps `SAVE_VERSION` cleanly. _Files:_ `save.ts`.

**Acceptance:** a new enemy with a burn vulnerability and a new tower applying
burn can be added with zero changes to `GameEngine.step()` control flow.

### Phase 2 — Additional Towers & Magic Towers

**Goal:** Crossbow, Mortar, Harpoon + magic towers (Veilflame, Tide Engine,
Storm Spire, Frost Obelisk, Ember Shrine).

**Depends on:** Phase 1 (status effects, damage pipeline).

- [ ] **2.1 Standard towers.** Add `crossbow` (multi-shot/pierce), `mortar`
  (long-range high-splash, min-range), `harpoon` (single-target pull/slow) to
  `TowerId` + `TOWER_DEFS` + `BUILDABLE_TOWERS`. _Files:_ `types.ts`,
  `data/towers.ts`.
- [ ] **2.2 Tower behavior flags.** Extend `TowerDef` with optional behavior
  fields (`pierceCount?`, `minRange?`, `appliesStatus?`). Honor them in
  `TowerManager.update` / projectile resolution. _Files:_ `types.ts`,
  `TowerManager.ts`, `ProjectileManager.ts`.
- [ ] **2.3 Magic towers + Mana-as-build-resource.** Add the five magic towers;
  each applies a status (Veilflame=burn, Frost Obelisk=slow, Storm Spire=chain,
  Tide Engine=area pulse, Ember Shrine=aura buff). Decide cost model (gold +
  powder, or a new resource — see Phase 8). _Files:_ `data/towers.ts`,
  `bonuses.ts`, status framework.
- [ ] **2.4 Upgrades + UI.** Add per-tower upgrade entries to `UpgradeId`,
  `UP`, `UPGRADE_DEFS`, and a new magic group in `UPGRADE_GROUPS`. The Towers
  tab already renders `BUILDABLE_TOWERS`, so towers appear automatically.
  _Files:_ `data/upgrades.ts`, `types.ts`.
- [ ] **2.5 Renderer.** Give magic towers distinct colors/glyphs in
  `BattlefieldRenderer.drawTowers`. _Files:_ `BattlefieldRenderer.ts`.

**Acceptance:** all new towers buildable, upgradable, render distinctly, and
apply their statuses; build passes.

### Phase 3 — Fleet Expansion

**Goal:** Brigantine, Harpoon Schooner, Ghost Frigate, Dragonwake Man-o'-War.

**Depends on:** Phase 1; benefits from Phase 2 status framework.

- [ ] **3.1 New ship defs.** Add IDs to `ShipId` + `SHIP_DEFS` + `BUILDABLE_SHIPS`
  with ring assignments (`outer` ring is currently unused by ships — good home
  for capital ships). _Files:_ `types.ts`, `data/ships.ts`.
- [ ] **3.2 Special ship behaviors.** Ghost Frigate (ignores armor / phases),
  Man-o'-War (broadside volley), Harpoon Schooner (applies slow/pull). Extend
  `ShipDef` with behavior flags and honor in `ShipManager.update`. _Files:_
  `types.ts`, `ShipManager.ts`.
- [ ] **3.3 Fleet upgrades + UI.** Extend Fleet upgrade group; `shipsOwned`
  already tracks counts and the Fleet tab auto-renders `BUILDABLE_SHIPS`.
  _Files:_ `data/upgrades.ts`.
- [ ] **3.4 Save compat.** `shipsOwned` is a `Record<ShipId, number>`; ensure new
  ids default to 0 on load. _Files:_ `save.ts`, migration.

**Acceptance:** new ships recruitable, orbit correctly on their rings, exhibit
special behaviors, persist across reload.

### Phase 4 — Dragon System

**Goal:** Full dragon types (Blaze, Icey, Speedy, Elder) with hatch timers and
dragon abilities, expanding the current Trust-only hook.

**Depends on:** Phase 1 (status), Phase 2 (so dragon buffs interact with towers).

- [ ] **4.1 Data model.** Replace the single `DragonState` with a `dragons[]`
  collection: `{ type, hatchProgress, hatched, level }`. Add `DragonType` union
  and `DRAGON_DEFS`. Keep `trust` as a sanctuary-wide currency. _Files:_
  `types.ts`, new `data/dragons.ts`.
- [ ] **4.2 Hatch timers.** `DragonManager` ticks hatch progress per `step(dt)`;
  egg claim starts a timer; hatched dragons grant passive auras (Blaze=+tower
  dmg, Icey=enemy slow aura, Speedy=+fire rate, Elder=+all). _Files:_
  `DragonManager.ts`, `bonuses.ts` (fold dragon auras into `computeBonuses`).
- [ ] **4.3 Dragon abilities.** Add active dragon abilities to `AbilityId` or a
  parallel `DragonAbility` set (e.g., Blaze breath = big AoE burn). Reuse
  `AbilityManager` cooldown plumbing. _Files:_ `data/abilities.ts`,
  `AbilityManager.ts`, `AbilityBar.tsx`.
- [ ] **4.4 Sanctuary UI.** Expand the Dragons tab beyond the Trust readout:
  show eggs, hatch progress bars, dragon roster, and ability buttons. _Files:_
  `UpgradePanel.tsx` (DragonsTab), `EventToast.tsx`.
- [ ] **4.5 Renderer.** Draw hatched dragons circling/perched on the island.
  _Files:_ `BattlefieldRenderer.ts`.

**Acceptance:** at least two dragon types hatch on timers, grant distinct auras,
and one has an active ability; sanctuary tab reflects state; saves persist.

### Phase 5 — The Five Pirate King Factions

**Goal:** Faction-themed enemies, mechanics, and counter-upgrades.

**Depends on:** Phases 1–2 (status/damage pipeline, counter mechanics).

- [ ] **5.1 `FactionManager`.** New manager that selects an active faction per
  run/region and biases the spawn pool. Use the reserved `Family` tags. _Files:_
  new `managers/FactionManager.ts`, `GameEngine.ts`.
- [ ] **5.2 Faction enemies.** Add `EnemyId`s + `ENEMY_DEFS` with faction
  gimmicks (e.g., shielded, fast-swarm, healer, summoner). Extend `EnemyDef`
  with behavior flags; honor in `EnemyManager`. _Files:_ `types.ts`,
  `data/enemies.ts`, `EnemyManager.ts`.
- [ ] **5.3 Faction waves & bosses.** `WaveManager.buildQueue` already special-
  cases boss waves; extend it to pull faction-specific bosses and escorts.
  _Files:_ `WaveManager.ts`.
- [ ] **5.4 Counter-upgrades.** Add upgrades that hard-counter faction gimmicks
  (armor-shred vs shielded, splash vs swarms). _Files:_ `data/upgrades.ts`.
- [ ] **5.5 UI.** Surface the active faction (banner/topbar) and counter hints.
  _Files:_ `TopBar.tsx`, `WaveBanner.tsx`.

**Acceptance:** at least two factions with distinct enemies/bosses, a working
counter-upgrade, and visible faction indication.

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

- 2026-06-23 — docs — Expanded ImplementationPlan into a central living tracker:
  added status legend, progress dashboard, code-quality backlog (Section A), and
  detailed Phase 1–8 roadmap steps grounded in the current files.
- 2026-06-23 — docs — Initial implementation review & suggestions documented.
- (earlier) — build — MVP vertical slice completed; strict build passing.

---

## 🧭 Open Decisions (resolve before the dependent phase)

- [!] **Magic-tower cost model** (Phase 2/8): reuse powder, or introduce a new
  "essence"/mana-crystal resource? Affects `ResourceId`.
- [!] **Dragon data shape** (Phase 4): single evolving sanctuary vs. a roster of
  individual dragons. Roadmap assumes a roster.
- [!] **Faction selection** (Phase 5): one faction per run, per region, or
  rotating by wave band?
- [!] **Prestige currency source** (Phase 7): waves, bosses, trust, or a blend?
