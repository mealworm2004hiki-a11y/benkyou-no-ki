import { useEffect } from 'react';
import { useGame } from '../../game/store';
import { fetchPrice, INSTRUMENTS, needsRefresh } from '../../game/invest';
import { dateKey } from '../../utils/date';
import { HoldingRow } from './HoldingRow';

export function InvestScreen() {
  const { game, setPriceCache } = useGame();
  const apiKey = game.twelveDataApiKey;

  useEffect(() => {
    if (!apiKey) return;
    const today = dateKey(new Date());
    for (const inst of INSTRUMENTS) {
      if (!needsRefresh(game.priceCache[inst.symbol], today)) continue;
      fetchPrice(inst.symbol, apiKey).then((price) => {
        if (price === null) return; // 失敗時は古いキャッシュのまま、他銘柄の取得は続行
        setPriceCache(inst.symbol, { price, asOf: today, fetchedAt: new Date().toISOString() });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const totalValue = game.holdings.reduce((sum, h) => {
    const price = game.priceCache[h.symbol]?.price;
    return sum + (price !== undefined ? h.quantity * price : 0);
  }, 0);
  const totalCost = game.holdings.reduce((sum, h) => sum + h.costBasis, 0);
  const totalPl = totalValue - totalCost;
  const totalPlRounded = Math.round(totalPl) + 0; // +0 で Math.round(-0.x) の "-0" 表示を防ぐ

  return (
    <section className="section invest-screen">
      {!apiKey && (
        <p className="invest-key-notice">
          価格情報を更新するには、設定でTwelve DataのAPIキーを入力してください。未設定でも保有中の銘柄はキャッシュ済みの価格で表示されます。
        </p>
      )}

      {game.holdings.length > 0 && (
        <div className="invest-summary">
          <div>
            <span className="invest-summary-label">評価額</span>
            <span className="invest-summary-value">{Math.round(totalValue).toLocaleString()}</span>
          </div>
          <div>
            <span className="invest-summary-label">損益</span>
            <span className={`invest-summary-value ${totalPlRounded >= 0 ? 'positive' : 'negative'}`}>
              {totalPlRounded > 0 ? '+' : ''}
              {totalPlRounded.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {INSTRUMENTS.map((inst) => (
        <HoldingRow key={inst.symbol} instrument={inst} priceEntry={game.priceCache[inst.symbol]} />
      ))}
    </section>
  );
}
