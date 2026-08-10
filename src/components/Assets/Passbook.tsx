import { useGame } from '../../game/store';
import { CoinIcon } from '../CoinIcon';
import { BalanceHistoryChart } from './BalanceHistoryChart';
import { LedgerReason } from '../../game/types';

const REASON_LABEL: Record<string, string> = {
  session: '勉強で獲得',
  pioneer_bonus: '開拓ボーナス',
  weekly_challenge: '週替わりお題',
  plant_crop: '種を購入',
  expand_land: '土地拡張',
  donate_growth: '里山への寄進',
  reward_redeem: 'ご褒美交換',
  invest_buy: '投資: 購入',
  invest_sell: '投資: 売却',
  adjust: '調整',
};

/** 台帳の色分けドット。稼ぐ系=緑、村サイクルの消費=橙、ご褒美交換=赤、調整=灰。 */
const REASON_DOT: Record<LedgerReason, 'green' | 'orange' | 'red' | 'gray'> = {
  session: 'green',
  pioneer_bonus: 'green',
  weekly_challenge: 'green',
  invest_sell: 'green',
  plant_crop: 'orange',
  expand_land: 'orange',
  donate_growth: 'orange',
  invest_buy: 'orange',
  reward_redeem: 'red',
  adjust: 'gray',
};

function dateLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function Passbook() {
  const { game } = useGame();
  const recent = [...game.ledger].reverse().slice(0, 20);

  return (
    <section className="section passbook">
      <div className="passbook-card">
        <div className="passbook-balance">
          <CoinIcon size={32} />
          <span className="passbook-amount">{game.coins.toLocaleString()}</span>
        </div>
        <span className="passbook-high-badge">過去最高{game.allTimeHighCoins.toLocaleString()}</span>

        <BalanceHistoryChart />
      </div>

      <h2 className="section-title">最近の動き</h2>
      <ul className="ledger-list">
        {recent.map((e) => (
          <li key={e.id} className="ledger-item">
            <span className={`ledger-dot ledger-dot-${REASON_DOT[e.reason]}`} />
            <span className="ledger-main">
              <span className="ledger-reason">
                {REASON_LABEL[e.reason] ?? e.reason}
                {e.note ? `(${e.note})` : ''}
              </span>
              <span className="ledger-date">{dateLabel(e.at)}</span>
            </span>
            <span className={`ledger-amount ${e.amount >= 0 ? 'positive' : 'negative'}`}>
              {e.amount >= 0 ? '+' : ''}
              {e.amount.toLocaleString()}
            </span>
          </li>
        ))}
        {recent.length === 0 && <p className="empty-state">まだ記録がありません</p>}
      </ul>
    </section>
  );
}
