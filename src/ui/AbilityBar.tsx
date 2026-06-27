import type { GameEngine } from "../game/GameEngine";
import type { GameSnapshot } from "../game/types";
import { ABILITY_DEFS, ABILITY_LIST, ABILITY_TUNING } from "../game/data/abilities";
import { CostLabel } from "./costUtil";

export function AbilityBar({
  engine,
  snap,
}: {
  engine: GameEngine;
  snap: GameSnapshot;
}) {
  return (
    <div className="ability-bar">
      {ABILITY_LIST.map((id) => {
        const def = ABILITY_DEFS[id];
        const st = snap.abilities[id];
        const onCd = st.cooldown > 0;
        const affordable = engine.canAfford(def.cost);
        const armed = snap.armedAbility === id;
        // Jasper's Ghost Frigate is only castable below half island HP.
        const hpGated =
          id === "ghostFrigate" &&
          snap.islandHp / snap.maxIslandHp >= ABILITY_TUNING.ghostFrigateHpThreshold;
        const disabled = onCd || !affordable || snap.gameOver || hpGated;
        return (
          <button
            key={id}
            className={`ability${armed ? " armed" : ""}`}
            disabled={disabled}
            onClick={() => engine.armAbility(id)}
            title={hpGated ? "Only when the island is below half health." : def.desc}
          >
            <div className="aname">{def.name}</div>
            <div className="acost">
              {hpGated ? (
                "island < 50% HP"
              ) : (
                <>
                  <CostLabel cost={def.cost} resources={snap.resources} />
                  {def.targeted ? " · target" : ""}
                </>
              )}
            </div>
            {onCd && (
              <div
                className="cooldown"
                style={{ width: `${(1 - st.cooldown / def.cooldown) * 100}%` }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
