import type { GameEngine } from "../game/GameEngine";
import type {
  GameSnapshot,
  ResourceId,
  ResourceMap,
  SelectedTowerUpgrade,
  TowerUpgradeKind,
} from "../game/types";
import { fmt } from "../game/math";
import { CostLabel, RESOURCE_META } from "./costUtil";
import { useClampedPosition } from "./useClampedPosition";

/** Compact "120 G · 24 S" summary of a refund map (always shown as positive). */
function refundSummary(map: Partial<ResourceMap>): string {
  return (Object.keys(map) as ResourceId[])
    .filter((id) => (map[id] ?? 0) > 0)
    .map((id) => `${fmt(map[id] ?? 0)} ${RESOURCE_META[id].name.slice(0, 1)}`)
    .join(" · ");
}

const KIND_META: Record<TowerUpgradeKind, { label: string; desc: string }> = {
  dmg: { label: "Damage", desc: "+25% damage" },
  range: { label: "Range", desc: "+14 range" },
  rate: { label: "Fire Rate", desc: "-8% reload" },
};

/**
 * Floating popup for the placed tower currently selected on the battlefield.
 * Shows live combat stats (damage / fire rate / DPS / range / splash / status)
 * and three independent upgrade tracks. Anchored at `x`/`y` (CSS pixels
 * relative to the battlefield) next to the clicked tower.
 */
export function TowerDetailPanel({
  engine,
  snap,
  anchor,
  onClose,
}: {
  engine: GameEngine;
  snap: GameSnapshot;
  anchor: { x: number; y: number };
  onClose: () => void;
}) {
  const { ref, style } = useClampedPosition<HTMLDivElement>(anchor);
  const sel = snap.selectedTower;
  if (!sel) return null;
  const st = sel.stats;

  const row = (kind: TowerUpgradeKind, up: SelectedTowerUpgrade) => {
    const meta = KIND_META[kind];
    const affordable = engine.canAfford(up.cost);
    return (
      <button
        key={kind}
        className="tower-upgrade-btn"
        disabled={up.maxed || !affordable}
        onClick={() => engine.upgradeSelectedTower(kind)}
      >
        <span className="tu-name">
          {meta.label} <span className="tu-lvl">Lv {up.level}</span>
        </span>
        <span className="tu-desc">{meta.desc}</span>
        <span className="tu-cost">
          {up.maxed ? "MAX" : <CostLabel cost={up.cost} resources={snap.resources} />}
        </span>
      </button>
    );
  };

  const stat = (label: string, value: string) => (
    <div className="ts-cell">
      <span className="ts-label">{label}</span>
      <span className="ts-value">{value}</span>
    </div>
  );

  return (
    <div
      ref={ref}
      className="tower-popup"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="tower-detail-head">
        <span className="td-title">{sel.name}</span>
        <button className="td-close" onClick={onClose} title="Deselect">
          ✕
        </button>
      </div>

      <div className="tower-popup-body">
        <div className="tower-stats">
          {st.support ? (
            <>
              {stat("Range", fmt(st.range))}
              {st.status && stat("Effect", st.status.id)}
            </>
          ) : (
            <>
              {stat("DPS", fmt(st.dps))}
              {stat("Damage", fmt(st.damage))}
              {stat("Fire Rate", `${st.fireRate.toFixed(2)}/s`)}
              {stat("Range", fmt(st.range))}
              {st.splash > 0 && stat("Splash", fmt(st.splash))}
              {st.bossMultiplier !== 1 &&
                stat("vs Boss", `${st.bossMultiplier.toFixed(1)}×`)}
              {st.status && stat("Effect", st.status.id)}
            </>
          )}
        </div>

        <div className="tower-upgrade-list">
          {row("dmg", sel.dmg)}
          {row("range", sel.range)}
          {row("rate", sel.rate)}
        </div>

        <button
          className="tower-sell-btn"
          title="Sell this tower for 50% of everything spent on it"
          onClick={() => {
            engine.sellTower(sel.uid);
            onClose();
          }}
        >
          <span className="tsell-label">Sell Tower</span>
          <span className="tsell-refund">+{refundSummary(sel.sellValue)}</span>
        </button>
      </div>
    </div>
  );
}
