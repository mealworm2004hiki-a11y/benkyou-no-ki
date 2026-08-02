import { useStore } from '../../store';
import { WEEKDAY_LABELS } from '../../types';

export function WeeklyGoalsEditor() {
  const { settings, updateSettings } = useStore();

  function setGoal(idx: number, minutes: number) {
    const next = [...settings.weeklyGoals] as typeof settings.weeklyGoals;
    next[idx] = Math.max(0, minutes);
    updateSettings({ weeklyGoals: next });
  }

  return (
    <div className="weekly-goals-editor">
      {WEEKDAY_LABELS.map((label, idx) => (
        <label className="weekly-goal-row" key={label}>
          <span className="weekday-label">{label}曜日</span>
          <input
            type="number"
            min="0"
            step="5"
            value={settings.weeklyGoals[idx]}
            onChange={(e) => setGoal(idx, parseInt(e.target.value || '0', 10))}
          />
          <span className="unit">分</span>
        </label>
      ))}
    </div>
  );
}
