import { useGame } from '../../game/store';
import { stageForPoints } from '../../game/stages';
import { CROPS, cropById, materialById } from '../../game/masters';
import { cropProgress } from '../../game/crops';
import { Tile } from '../../game/types';
import { haptics, playComplete, playStart, playWarn } from '../../utils/sfx';

interface Props {
  tile: Tile;
  onClose: () => void;
}

function formatLeft(minutes: number): string {
  const m = Math.ceil(minutes);
  if (m < 60) return `あと${m}分`;
  const h = Math.floor(m / 60);
  return `あと${h}時間${m % 60}分`;
}

export function PlotSheet({ tile, onClose }: Props) {
  const { game, plantCrop, harvestTile } = useGame();
  const stage = stageForPoints(game.growthPoints);

  // 最新のタイル状態をストアから引き直す
  const current = game.tiles.find((t) => t.id === tile.id) ?? tile;
  const planting = current.planting;
  const prog = planting ? cropProgress(planting) : null;
  const crop = planting ? cropById(planting.cropId) : null;

  function handlePlant(cropId: string) {
    const ok = plantCrop(current.id, cropId);
    if (ok) {
      playStart();
      haptics.medium();
      onClose();
    } else {
      playWarn();
      haptics.warn();
    }
  }

  function handleHarvest() {
    const ok = harvestTile(current.id);
    if (ok) {
      playComplete();
      haptics.success();
      onClose();
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {planting && crop && prog ? (
          <>
            <p className="sheet-title">
              {crop.emoji} {crop.name}
            </p>
            {prog.ready ? (
              <>
                <p className="hint">実りました！収穫できます。</p>
                <div className="sheet-yield">
                  {materialById(crop.yieldMaterialId)?.emoji} {materialById(crop.yieldMaterialId)?.name} ×{crop.yieldAmount}
                </div>
                <button className="primary-btn" onClick={handleHarvest}>
                  収穫する
                </button>
              </>
            ) : (
              <>
                <p className="hint">{formatLeft(prog.minutesLeft)}で収穫できます</p>
                <div className="grow-track">
                  <div className="grow-fill" style={{ width: `${Math.round(prog.progress * 100)}%` }} />
                </div>
                <button className="secondary-btn" onClick={onClose}>
                  とじる
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <p className="sheet-title">🌱 何を植える？</p>
            <p className="hint">タネはコインで買えます（コインは勉強で貯まります）</p>
            <div className="seed-list">
              {CROPS.map((c) => {
                const locked = stage.id < c.unlockLevel;
                const tooPoor = game.coins < c.seedCost;
                return (
                  <button
                    key={c.id}
                    className={`seed-card ${locked || tooPoor ? 'disabled' : ''}`}
                    disabled={locked || tooPoor}
                    onClick={() => handlePlant(c.id)}
                  >
                    <span className="seed-emoji">{c.emoji}</span>
                    <span className="seed-name">{c.name}</span>
                    {locked ? (
                      <span className="seed-meta">Lv.{c.unlockLevel}で解禁</span>
                    ) : (
                      <>
                        <span className="seed-cost">🪙 {c.seedCost}</span>
                        <span className="seed-meta">{c.growMinutes}分で収穫</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
            <button className="text-btn" onClick={onClose}>
              やめる
            </button>
          </>
        )}
      </div>
    </div>
  );
}
