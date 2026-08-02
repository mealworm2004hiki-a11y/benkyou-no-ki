import { useStore } from '../../store';
import { dateKey, formatMinutes } from '../../utils/date';
import { WeeklySummary } from '../Visualize/WeeklySummary';
import { Heatmap } from '../Visualize/Heatmap';
import { SubjectBarChart } from '../Visualize/SubjectBarChart';
import { ResumeBanner } from './ResumeBanner';
import { IntentPlanner } from './IntentPlanner';
import { DryFieldReminder } from './DryFieldReminder';
import { FreshStartBanner } from './FreshStartBanner';
import { WeeklyDigest } from './WeeklyDigest';
import { VillageCard } from './VillageCard';
import { AlmostThereBanner } from './AlmostThereBanner';
import { WeeklyChallengeCard } from './WeeklyChallengeCard';

interface Props {
  onGoToTimer: () => void;
  onGoToVillage: () => void;
}

export function HomeScreen({ onGoToTimer, onGoToVillage }: Props) {
  const { dailyTotals, settings, streak } = useStore();
  const today = new Date();
  const todaySec = dailyTotals.get(dateKey(today)) ?? 0;
  const todayGoalMin = settings.weeklyGoals[today.getDay()];
  const todayGoalSec = todayGoalMin * 60;
  const pct = todayGoalSec > 0 ? Math.min(100, Math.round((todaySec / todayGoalSec) * 100)) : 0;

  return (
    <div className="screen home-screen">
      <div className="home-header">
        <h1 className="screen-title">勉強の木</h1>
        <div className="streak-badge">🔥 {streak}日連続</div>
      </div>

      <FreshStartBanner />
      <ResumeBanner onGoToTimer={onGoToTimer} />
      <IntentPlanner onGoToTimer={onGoToTimer} />
      <DryFieldReminder onGoToTimer={onGoToTimer} />
      <AlmostThereBanner onGoToTimer={onGoToTimer} />

      <VillageCard onGoToVillage={onGoToVillage} />

      <WeeklyChallengeCard />

      <div className="today-goal">
        <div className="today-goal-row">
          <span>今日: {formatMinutes(todaySec)}</span>
          <span className="today-goal-target">目標 {todayGoalMin}分</span>
        </div>
        <div className="goal-progress-track">
          <div className="goal-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <WeeklySummary />

      <section className="section">
        <h2 className="section-title">学習カレンダー</h2>
        <Heatmap />
      </section>

      <section className="section">
        <h2 className="section-title">科目別</h2>
        <SubjectBarChart />
      </section>

      <WeeklyDigest />
    </div>
  );
}
