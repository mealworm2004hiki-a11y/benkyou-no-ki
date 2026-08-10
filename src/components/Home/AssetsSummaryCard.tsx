import { useGame } from '../../game/store';
import { tierForLifetime } from '../../game/rank';
import { CoinIcon } from '../CoinIcon';

/** ホームに置く「いまの資産」カード。タップで資産タブへ。 */
export function AssetsSummaryCard({ onGoToAssets }: { onGoToAssets: () => void }) {
  const { game } = useGame();
  const tier = tierForLifetime(game.lifetimeEarned);

  return (
    <button className="assets-summary-card" onClick={onGoToAssets}>
      <div className="assets-summary-balance">
        <CoinIcon size={26} />
        <span className="assets-summary-amount">{game.coins.toLocaleString()}</span>
      </div>
      <span className="assets-summary-rank">{tier.name}</span>
    </button>
  );
}
