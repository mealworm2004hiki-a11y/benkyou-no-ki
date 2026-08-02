import { useStore } from '../../store';
import { formatMinutes } from '../../utils/date';

export function WeeklySummary() {
  const { thisWeekTotal, lastWeekTotal } = useStore();
  const diffSec = thisWeekTotal - lastWeekTotal;
  const diffLabel = diffSec === 0 ? '先週と同じ' : diffSec > 0 ? `先週より ${formatMinutes(Math.abs(diffSec))} 多い` : `先週より ${formatMinutes(Math.abs(diffSec))} 少ない`;

  return (
    <div className="weekly-summary">
      <div className="weekly-summary-main">
        <span className="weekly-summary-label">今週の合計</span>
        <span className="weekly-summary-value">{formatMinutes(thisWeekTotal)}</span>
      </div>
      <span className={`weekly-summary-diff ${diffSec >= 0 ? 'up' : 'down'}`}>{diffLabel}</span>
    </div>
  );
}
