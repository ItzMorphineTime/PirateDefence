import type { GameEngine } from "../game/GameEngine";
import type { GameSnapshot } from "../game/types";

export function EventToast({
  engine,
  snap,
}: {
  engine: GameEngine;
  snap: GameSnapshot;
}) {
  if (!snap.eventToast) return null;
  const isEgg = !snap.dragon.eggClaimed && snap.dragon.eggDiscovered;
  return (
    <div className="event-toast">
      <div className="et-title">{snap.eventToast.title}</div>
      <div className="et-body">{snap.eventToast.body}</div>
      {isEgg ? (
        <button onClick={() => engine.claimEgg()}>Claim the Egg (begin sanctuary)</button>
      ) : (
        <button onClick={() => engine.dismissToast()}>Dismiss</button>
      )}
    </div>
  );
}
