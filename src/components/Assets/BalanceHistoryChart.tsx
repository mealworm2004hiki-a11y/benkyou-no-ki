import { useMemo } from 'react';
import { useGame } from '../../game/store';
import { dateKey } from '../../utils/date';

const W = 320;
const H = 120;
const PAD = 8;

/** 残高の推移グラフ。ledgerを日別に間引き(その日最後のbalanceAfter)、手描きSVGの折れ線で描く。 */
export function BalanceHistoryChart() {
  const { game } = useGame();

  const points = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const e of game.ledger) {
      byDay.set(dateKey(new Date(e.at)), e.balanceAfter);
    }
    const entries = Array.from(byDay.entries());
    if (entries.length === 0) return [];
    if (entries.length === 1) return [entries[0][1], entries[0][1]];
    return entries.map(([, v]) => v);
  }, [game.ledger]);

  if (points.length < 2) {
    return <p className="empty-state">まだ記録が少ないので、グラフはこれから育ちます</p>;
  }

  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(1, max - min);
  const stepX = (W - PAD * 2) / (points.length - 1);
  const xy = points.map((v, i) => {
    const x = PAD + i * stepX;
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return [x, y] as const;
  });
  const linePoints = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPoints = `${PAD.toFixed(1)},${(H - PAD).toFixed(1)} ${linePoints} ${(W - PAD).toFixed(1)},${(H - PAD).toFixed(1)}`;
  const gridLines = [0.25, 0.5, 0.75].map((f) => H - PAD - f * (H - PAD * 2));
  const [lastX, lastY] = xy[xy.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="balance-chart" role="img" aria-label="残高の推移">
      <defs>
        <linearGradient id="balanceChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridLines.map((y, i) => (
        <line key={i} x1={PAD} y1={y} x2={W - PAD} y2={y} className="balance-chart-grid" />
      ))}
      <polygon points={areaPoints} className="balance-chart-area" />
      <polyline points={linePoints} fill="none" className="balance-chart-line" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3.5" className="balance-chart-dot" />
    </svg>
  );
}
