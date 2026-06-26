import { useState } from "react";
import type { GameEngine } from "../game/GameEngine";
import type { GameSnapshot, ShipId, UpgradeId } from "../game/types";
import { UPGRADE_DEFS, UPGRADE_GROUPS } from "../game/data/upgrades";
import { BUILDABLE_TOWERS, TOWER_DEFS } from "../game/data/towers";
import { BUILDABLE_SHIPS, SHIP_DEFS } from "../game/data/ships";
import { CostLabel } from "./costUtil";
import { fmt } from "../game/math";
import {
  DRAGON_DEFS,
  DRAGON_LIST,
  DRAGON_ABILITY_DEFS,
  DRAGON_ABILITY_LIST,
  DRAGON_ABILITY_OWNER,
} from "../game/data/dragons";

type Tab = "towers" | "fleet" | "treasury" | "dragons";

const TABS: { id: Tab; label: string }[] = [
  { id: "towers", label: "Towers" },
  { id: "fleet", label: "Fleet" },
  { id: "treasury", label: "Magic" },
  { id: "dragons", label: "Dragons" },
];

export function UpgradePanel({
  engine,
  snap,
  selectedTower,
  onSelectTower,
}: {
  engine: GameEngine;
  snap: GameSnapshot;
  selectedTower: string | null;
  onSelectTower: (id: string | null) => void;
}) {
  const [tab, setTab] = useState<Tab>("towers");

  return (
    <>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="tab-body">
        {tab === "towers" && (
          <TowersTab
            engine={engine}
            snap={snap}
            selectedTower={selectedTower}
            onSelectTower={onSelectTower}
          />
        )}
        {tab === "fleet" && <FleetTab engine={engine} snap={snap} />}
        {tab === "treasury" && <UpgradeGroup engine={engine} snap={snap} groupIndex={2} />}
        {tab === "dragons" && <DragonsTab engine={engine} snap={snap} />}
      </div>
    </>
  );
}

function TowersTab({
  engine,
  snap,
  selectedTower,
  onSelectTower,
}: {
  engine: GameEngine;
  snap: GameSnapshot;
  selectedTower: string | null;
  onSelectTower: (id: string | null) => void;
}) {
  return (
    <>
      <div className="section-title">Build a Tower</div>
      <div className="hint">
        Select a tower, then click a glowing <b>+</b> slot on the island.
      </div>
      {BUILDABLE_TOWERS.map((id) => {
        const def = TOWER_DEFS[id];
        const affordable = engine.canAfford(def.buildCost);
        const sel = selectedTower === id;
        return (
          <button
            key={id}
            className="buy-row"
            style={sel ? { borderColor: "var(--accent)" } : undefined}
            disabled={!affordable && !sel}
            onClick={() => onSelectTower(sel ? null : id)}
          >
            <span
              className="dot"
              style={{ background: def.color, width: 11, height: 11, borderRadius: "50%" }}
            />
            <span className="info">
              <span className="name">{def.name}</span>
              <span className="desc">{def.desc}</span>
            </span>
            <span className="cost">
              <CostLabel cost={def.buildCost} resources={snap.resources} />
            </span>
          </button>
        );
      })}

      <div className="section-title">Tower Upgrades</div>
      <UpgradeGroup engine={engine} snap={snap} groupIndex={0} />
    </>
  );
}

function FleetTab({ engine, snap }: { engine: GameEngine; snap: GameSnapshot }) {
  return (
    <>
      <div className="section-title">Recruit Ships (orbit the island)</div>
      {BUILDABLE_SHIPS.map((id) => {
        const def = SHIP_DEFS[id];
        const owned = snap.shipsOwned[id as ShipId] ?? 0;
        const affordable = engine.canAfford(def.buildCost);
        return (
          <button
            key={id}
            className="buy-row"
            disabled={!affordable}
            onClick={() => engine.buyShip(id)}
          >
            <span className="info">
              <span className="name">
                {def.name} <span className="lvl">×{owned}</span>
              </span>
              <span className="desc">{def.desc}</span>
            </span>
            <span className="cost">
              <CostLabel cost={def.buildCost} resources={snap.resources} />
            </span>
          </button>
        );
      })}

      <div className="section-title">Fleet Upgrades</div>
      <UpgradeGroup engine={engine} snap={snap} groupIndex={1} />
    </>
  );
}

function UpgradeGroup({
  engine,
  snap,
  groupIndex,
}: {
  engine: GameEngine;
  snap: GameSnapshot;
  groupIndex: number;
}) {
  const group = UPGRADE_GROUPS[groupIndex];
  return (
    <>
      {group.ids.map((id: UpgradeId) => {
        const def = UPGRADE_DEFS[id];
        const lvl = snap.upgradeLevels[id];
        const cost = engine.upgradeCost(id);
        const affordable = engine.canAfford(cost);
        return (
          <button
            key={id}
            className="buy-row"
            disabled={!affordable}
            onClick={() => engine.buyUpgrade(id)}
          >
            <span className="info">
              <span className="name">
                {def.name} <span className="lvl">Lv {lvl}</span>
              </span>
              <span className="desc">
                {def.desc} · {def.effectLabel(lvl)}
              </span>
            </span>
            <span className="cost">
              <CostLabel cost={cost} resources={snap.resources} />
            </span>
          </button>
        );
      })}
    </>
  );
}

/** Short, human-readable summary of a dragon's passive aura. */
function auraLabel(magnitude: number, kind: string): string {
  const pct = Math.round(magnitude * 100);
  switch (kind) {
    case "towerDamage":
      return `+${pct}% tower damage`;
    case "enemySlow":
      return `Enemies move ${pct}% slower`;
    case "fireRate":
      return `+${pct}% tower fire rate`;
    case "all":
      return `+${pct}% to every dragon gift`;
    default:
      return "";
  }
}

function DragonsTab({
  engine,
  snap,
}: {
  engine: GameEngine;
  snap: GameSnapshot;
}) {
  const d = snap.dragon;
  if (!d.eggDiscovered) {
    return (
      <div className="hint">
        The sanctuary sleeps. Survive a few waves and you may discover something
        hidden in the plundered cargo...
      </div>
    );
  }
  if (!d.eggClaimed) {
    return (
      <div className="hint">
        A dragon egg has been discovered! Claim it from the event prompt to begin
        the sanctuary and earn <b>Dragon Trust</b>.
      </div>
    );
  }
  return (
    <>
      <div className="section-title">Dragon Sanctuary</div>
      <div className="buy-row" style={{ cursor: "default" }}>
        <span className="info">
          <span className="name" style={{ color: "var(--trust)" }}>
            Dragon Trust: {fmt(d.trust)}
          </span>
          <span className="desc">
            Spend Trust to hatch dragons. Earn more by defeating bosses and
            clearing waves.
          </span>
        </span>
      </div>

      <div className="section-title">Hatch Dragons</div>
      {DRAGON_LIST.map((id) => {
        const def = DRAGON_DEFS[id];
        const hatched = d.hatched.includes(id);
        const affordable = d.trust >= def.hatchCost;
        return (
          <button
            key={id}
            className="buy-row"
            style={hatched ? { cursor: "default", opacity: 0.85 } : undefined}
            disabled={hatched || !affordable}
            onClick={() => !hatched && engine.hatchDragon(id)}
          >
            <span
              className="dot"
              style={{
                background: def.color,
                width: 11,
                height: 11,
                borderRadius: "50%",
              }}
            />
            <span className="info">
              <span className="name">
                {def.name}
                {hatched && <span className="lvl"> Hatched</span>}
              </span>
              <span className="desc">{auraLabel(def.auraMagnitude, def.aura)}</span>
            </span>
            {!hatched && (
              <span className="cost" style={{ color: "var(--trust)" }}>
                {fmt(def.hatchCost)} Trust
              </span>
            )}
          </button>
        );
      })}

      <DragonAbilities engine={engine} snap={snap} />
    </>
  );
}

function DragonAbilities({
  engine,
  snap,
}: {
  engine: GameEngine;
  snap: GameSnapshot;
}) {
  const d = snap.dragon;
  // Only show abilities whose owning dragon has hatched.
  const owned = DRAGON_ABILITY_LIST.filter((id) =>
    d.hatched.includes(DRAGON_ABILITY_OWNER[id])
  );
  if (owned.length === 0) return null;
  return (
    <>
      <div className="section-title">Dragon Abilities</div>
      {owned.map((id) => {
        const def = DRAGON_ABILITY_DEFS[id];
        const cd = d.abilityCooldowns[id] ?? 0;
        const ready = cd <= 0;
        const armed = snap.armedDragonAbility === id;
        const affordable = engine.canAfford(def.cost);
        return (
          <button
            key={id}
            className={`buy-row${armed ? " armed" : ""}`}
            style={armed ? { borderColor: "var(--accent)" } : undefined}
            disabled={!ready || !affordable}
            onClick={() => engine.armDragonAbility(id)}
          >
            <span className="info">
              <span className="name">{def.name}</span>
              <span className="desc">
                {ready ? def.desc : `Recharging… ${cd.toFixed(1)}s`}
              </span>
            </span>
            <span className="cost">
              <CostLabel cost={def.cost} resources={snap.resources} />
            </span>
          </button>
        );
      })}
    </>
  );
}
