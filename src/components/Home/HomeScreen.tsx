import { useStore } from '../../store';
import { dateKey, formatMinutes } from '../../utils/date';
import { FreshStartBanner } from './FreshStartBanner';
import { ResumeBanner } from './ResumeBanner';
import { IntentPlanner } from './IntentPlanner';
import { PacerCard } from './PacerCard';
import { MathWeekCard, EnglishDailyCard } from './StreakCards';

interface Props {
  onGoToTimer: () => void;
}

export function HomeScreen({ onGoToTimer }: Props) {
  const { dailyTotals, settings, requestQuickStart } = useStore();
  const today = new Date();
  const todaySec = dailyTotals.get(dateKey(today)) ?? 0;
  const todayGoalMin = settings.weeklyGoals[today.getDay()];
  const todayGoalSec = todayGoalMin * 60;
  const pct = todayGoalSec > 0 ? Math.min(100, Math.round((todaySec / todayGoalSec) * 100)) : 0;

  function startEnglish() {
    if (settings.englishCategoryId) {
      requestQuickStart(settings.englishCategoryId, true);
      onGoToTimer();
    }
  }

  return (
    <div className="screen home-screen">
      <div className="home-header">
        <h1 className="screen-title">勉強の木</h1>
      </div>

      <FreshStartBanner />
      <ResumeBanner onGoToTimer={onGoToTimer} />
      <IntentPlanner onGoToTimer={onGoToTimer} />

      <PacerCard onGoToTimer={onGoToTimer} />

      <MathWeekCard />

      <EnglishDailyCard onStartEnglish={startEnglish} />

      <div className="today-goal">
        <div className="today-goal-row">
          <span>今日: {formatMinutes(todaySec)}</span>
          <span className="today-goal-target">目標 {todayGoalMin}分</span>
        </div>
        <div className="goal-progress-track">
          <div className="goal-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
