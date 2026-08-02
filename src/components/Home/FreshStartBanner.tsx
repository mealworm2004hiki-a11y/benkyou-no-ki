import { useStore } from '../../store';
import { dateKey, isFirstOfMonth, isMonday } from '../../utils/date';

export function FreshStartBanner() {
  const { dailyTotals, streak } = useStore();
  const today = new Date();
  const todaySec = dailyTotals.get(dateKey(today)) ?? 0;
  const isMilestoneDay = isMonday(today) || isFirstOfMonth(today);

  if (!isMilestoneDay || todaySec > 0) return null;

  const label = isFirstOfMonth(today) ? '新しい月がはじまりました' : '新しい週がはじまりました';
  const sub = streak > 0 ? '今週も里山を育てていきましょう' : 'また今日から、一歩ずつ育てていきましょう';

  return (
    <div className="fresh-start-banner">
      <span className="fresh-start-emoji">🌅</span>
      <div>
        <p className="banner-title">{label}</p>
        <p className="hint">{sub}</p>
      </div>
    </div>
  );
}
