import { useMemo } from 'react';
import { useStore } from '../../store';
import { addDays, dateKey, startOfDay } from '../../utils/date';
import { formatMinutes } from '../../utils/date';

const WEEKS = 18;

function levelFor(sec: number, max: number): number {
  if (sec <= 0) return 0;
  if (max <= 0) return 1;
  const ratio = sec / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.2) return 2;
  return 1;
}

export function Heatmap() {
  const { dailyTotals } = useStore();

  const { weeks, max } = useMemo(() => {
    const today = startOfDay(new Date());
    const todayDow = today.getDay();
    const gridStart = addDays(today, -(todayDow + (WEEKS - 1) * 7));
    let max = 0;
    const days: { key: string; date: Date; sec: number }[] = [];
    for (let i = 0; i < WEEKS * 7; i++) {
      const d = addDays(gridStart, i);
      const key = dateKey(d);
      const sec = dailyTotals.get(key) ?? 0;
      if (sec > max) max = sec;
      days.push({ key, date: d, sec });
    }
    const weeks: (typeof days)[] = [];
    for (let w = 0; w < WEEKS; w++) weeks.push(days.slice(w * 7, w * 7 + 7));
    return { weeks, max };
  }, [dailyTotals]);

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-scroll">
        <div className="heatmap-grid">
          {weeks.map((week, wi) => (
            <div className="heatmap-col" key={wi}>
              {week.map((day) => (
                <div
                  key={day.key}
                  className={`heatmap-cell level-${levelFor(day.sec, max)}`}
                  title={`${day.date.getMonth() + 1}/${day.date.getDate()} ${day.sec > 0 ? formatMinutes(day.sec) : '記録なし'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
