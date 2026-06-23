import type { ResourceId, ResourceMap } from "../game/types";
import { fmt } from "../game/math";

export const RESOURCE_META: Record<ResourceId, { name: string; color: string }> = {
  gold: { name: "Gold", color: "#f2c14e" },
  salvage: { name: "Salvage", color: "#b8c4d0" },
  powder: { name: "Powder", color: "#e07a3c" },
  mana: { name: "Mana", color: "#4ea3f2" },
};

export function CostLabel({
  cost,
  resources,
}: {
  cost: Partial<ResourceMap>;
  resources: ResourceMap;
}) {
  const parts = (Object.keys(cost) as ResourceId[]).map((id) => {
    const need = cost[id] ?? 0;
    const ok = resources[id] >= need;
    return (
      <span key={id} className={ok ? "ok" : "no"}>
        {fmt(need)} {RESOURCE_META[id].name.slice(0, 1)}
      </span>
    );
  });
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 ? " " : ""}
          {p}
        </span>
      ))}
    </>
  );
}
