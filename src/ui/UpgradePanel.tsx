import { useState } from "react";
import type { GameEngine } from "../game/GameEngine";
import type { GameSnapshot, ShipId, UpgradeId } from "../game/types";
import { UPGRADE_DEFS, UPGRADE_GROUPS } from "../game/data/upgrades";
import { BUILDABLE_TOWERS, TOWER_DEFS } from "../game/data/towers";
import { BUILDABLE_SHIPS, SHIP_DEFS } from "../game/data/ships";
import { CostLabel } from "./costUtil";
import { fmt } from "../game/math";
import { DRAGON_TRUST_DAMAGE_BONUS } from "../game/config";

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
        {tab === "dragons" && <DragonsTab snap={snap} />}
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

function DragonsTab({ snap }: { snap: GameSnapshot }) {
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
  const bonus = Math.round(d.trust * DRAGON_TRUST_DAMAGE_BONUS * 100);
  return (
    <>
      <div className="section-title">Dragon Sanctuary</div>
      <div className="buy-row" style={{ cursor: "default" }}>
        <span className="info">
          <span className="name" style={{ color: "var(--trust)" }}>
            Dragon Trust: {fmt(d.trust)}
          </span>
          <span className="desc">
            All towers deal +{bonus}% damage. Earn more Trust by defeating bosses.
          </span>
        </span>
      </div>
      <div className="hint">
        More dragon types, hatch timers, sanctuary upgrades, and dragon abilities
        will arrive as the Tidehold grows.
      </div>
    </>
  );
}
