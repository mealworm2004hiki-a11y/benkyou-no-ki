import { useGame } from '../../game/store';
import { villageView } from '../../game/stages';
import { formatPointHours } from '../../game/economy';
import { VillageArt } from '../Village/VillageArt';

/** ホームに置く「いまの村」カード。タップで村タブへ。 */
export function VillageCard({ onGoToVillage }: { onGoToVillage: () => void }) {
  const { game } = useGame();
  const points = game.growthPoints;
  const view = villageView(points);
  const { base: stage, work, workProgress } = view;
  const remain = work ? Math.max(0, work.fromPoints + work.points - points) : 0;

  return (
    <button className="village-card" onClick={onGoToVillage}>
      <div className="village-card-art">
        <VillageArt points={points} view={view} />
      </div>
      <div className="village-card-body">
        <span className="village-card-label">いまの里山</span>
        <span className="village-card-name">{stage.name}</span>
        {work ? (
          <>
            <div className="village-card-track">
              <div className="village-card-fill" style={{ width: `${Math.round(workProgress * 100)}%` }} />
            </div>
            <span className="village-card-next">
              {work.name} まで あと{remain}pt（{formatPointHours(remain)}）
            </span>
          </>
        ) : (
          <span className="village-card-next">里山が満ちました</span>
        )}
      </div>
    </button>
  );
}
