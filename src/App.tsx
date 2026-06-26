import { useEffect, useMemo, useState } from "react";
import { GameEngine } from "./game/GameEngine";
import { loadGame } from "./game/save";
import { useGameSnapshot } from "./ui/useEngine";
import { GameCanvas } from "./ui/GameCanvas";
import { TopBar } from "./ui/TopBar";
import { WaveBanner } from "./ui/WaveBanner";
import { EventToast } from "./ui/EventToast";
import { ResourceBar } from "./ui/ResourceBar";
import { UpgradePanel } from "./ui/UpgradePanel";
import { AbilityBar } from "./ui/AbilityBar";
import { SpeedControls } from "./ui/SpeedControls";

export function App() {
  const engine = useMemo(() => new GameEngine(loadGame()), []);
  const snap = useGameSnapshot(engine);
  const [selectedTower, setSelectedTower] = useState<string | null>(null);

  useEffect(() => {
    engine.start();
    return () => engine.stop();
  }, [engine]);

  return (
    <div className="app">
      <div className="battlefield">
        <GameCanvas
          engine={engine}
          snap={snap}
          selectedTower={selectedTower}
          onSelectTower={setSelectedTower}
        />
        <TopBar snap={snap} />
        <WaveBanner snap={snap} />
        <EventToast engine={engine} snap={snap} />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="game-title">Tidehold</div>
          <div className="game-sub">Dragonwake Defense</div>
        </div>
        <ResourceBar snap={snap} />
        <UpgradePanel
          engine={engine}
          snap={snap}
          selectedTower={selectedTower}
          onSelectTower={setSelectedTower}
        />
        <AbilityBar engine={engine} snap={snap} />
        <SpeedControls engine={engine} snap={snap} />
      </div>
    </div>
  );
}
