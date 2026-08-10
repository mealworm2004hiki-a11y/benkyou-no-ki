import { useGame } from '../../game/store';

export function RewardRedeemList() {
  const { game, redeemReward } = useGame();
  const active = game.rewards.filter((r) => !r.archived);
  const recentRedemptions = [...game.redemptions].reverse().slice(0, 10);

  return (
    <div className="reward-redeem-list">
      <div className="reward-grid">
        {active.map((r) => {
          const affordable = game.coins >= r.cost;
          const progress = Math.min(100, Math.round((game.coins / r.cost) * 100));
          return (
            <div key={r.id} className={`reward-card ${affordable ? 'is-ready' : ''}`}>
              <span className="reward-card-name">{r.name}</span>
              <span className="reward-card-cost">🪙{r.cost.toLocaleString()}</span>
              <div className="reward-card-progress-track">
                <div className="reward-card-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <button className="secondary-btn" disabled={!affordable} onClick={() => redeemReward(r.id)}>
                {affordable ? '交換する' : `あと🪙${(r.cost - game.coins).toLocaleString()}`}
              </button>
            </div>
          );
        })}
      </div>
      {active.length === 0 && <p className="empty-state">下の「ご褒美を編集」で登録すると、ここで交換できます</p>}

      {recentRedemptions.length > 0 && (
        <>
          <h3 className="reward-history-title">交換履歴</h3>
          <ul className="reward-history-list">
            {recentRedemptions.map((r) => (
              <li key={r.id} className="reward-history-item">
                <span>{r.name}</span>
                <span>🪙{r.cost.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
