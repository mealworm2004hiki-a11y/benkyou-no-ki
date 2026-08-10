import { useState } from 'react';
import { useGame } from '../../game/store';
import { Instrument } from '../../game/invest';
import { PriceCacheEntry } from '../../game/types';

interface Props {
  instrument: Instrument;
  priceEntry: PriceCacheEntry | undefined;
}

export function HoldingRow({ instrument, priceEntry }: Props) {
  const { game, buyHolding, sellHolding } = useGame();
  const [qty, setQty] = useState('');
  const holding = game.holdings.find((h) => h.symbol === instrument.symbol);
  const price = priceEntry?.price;
  const quantity = Number(qty);
  const canTrade = price !== undefined && Number.isFinite(quantity) && quantity > 0;

  const value = holding && price !== undefined ? holding.quantity * price : 0;
  const plRounded = holding ? Math.round(value - holding.costBasis) + 0 : 0; // +0 で "-0" 表示を防ぐ

  function buy() {
    if (!canTrade) return;
    if (buyHolding(instrument.symbol, quantity)) setQty('');
  }
  function sell() {
    if (!canTrade) return;
    if (sellHolding(instrument.symbol, quantity)) setQty('');
  }

  return (
    <div className="holding-row">
      <div className="holding-row-header">
        <span className="holding-name">{instrument.name}</span>
        <span className="holding-price">
          {price !== undefined ? `🪙${price.toLocaleString()}` : '価格未取得'}
          {priceEntry && <span className="holding-stale"> ({priceEntry.asOf}時点)</span>}
        </span>
      </div>

      {!holding && <span className="holding-unheld-tag">未保有</span>}

      {holding && (
        <div className="holding-position">
          <span>保有 {holding.quantity}</span>
          <span className={`holding-pl ${plRounded >= 0 ? 'positive' : 'negative'}`}>
            評価額 {Math.round(value).toLocaleString()}（{plRounded > 0 ? '+' : ''}
            {plRounded.toLocaleString()}）
          </span>
        </div>
      )}

      <div className="holding-trade-form">
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="数量"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          disabled={price === undefined}
        />
        <button className="secondary-btn" disabled={!canTrade} onClick={buy}>
          買う
        </button>
        <button className="secondary-btn" disabled={!canTrade || !holding || quantity > (holding?.quantity ?? 0)} onClick={sell}>
          売る
        </button>
      </div>
    </div>
  );
}
