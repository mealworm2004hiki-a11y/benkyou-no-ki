import { useGame } from '../../game/store';
import { villageView } from '../../game/stages';
import { formatPointHours } from '../../game/economy';

/** 今の工程が6割以上進んでいるとき、「あと少し」を後押しするバナー。 */
export function AlmostThereBanner({ onGoToTimer }: { onGoToTimer: () => void }) {
  const { game } = useGame();
  const view = villageView(game.growthPoints);
  if (!view.work || view.workProgress < 0.6) return null;

  const remainPt = Math.max(0, view.work.fromPoints + view.work.points - game.growthPoints);

  return (
    <div className="banner-card almost-banner">
      <div className="banner-icon">🛠️</div>
      <div className="banner-body">
        <p className="banner-title">「{view.work.name}」まで、あと少し</p>
        <p className="hint">
          あと{remainPt}pt（{formatPointHours(remainPt)}）で完成します
        </p>
      </div>
      <div className="banner-actions">
        <button className="primary-btn" onClick={onGoToTimer}>
          続きを勉強する
        </button>
      </div>
    </div>
  );
}
