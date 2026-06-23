import type { GameSnapshot, ResourceId } from "../game/types";
import { fmt } from "../game/math";
import { RESOURCE_META } from "./costUtil";

const ORDER: ResourceId[] = ["gold", "salvage", "powder", "mana"];

export function ResourceBar({ snap }: { snap: GameSnapshot }) {
  return (
    <div className="resource-bar">
      {ORDER.map((id) => {
        const meta = RESOURCE_META[id];
        const val =
          id === "mana"
            ? `${fmt(snap.resources.mana)} / ${fmt(snap.maxMana)}`
            : fmt(snap.resources[id]);
        return (
          <div className="res" key={id}>
            <span className="dot" style={{ background: meta.color }} />
            <span className="rname">{meta.name}</span>
            <span className="rval">{val}</span>
          </div>
        );
      })}
    </div>
  );
}
