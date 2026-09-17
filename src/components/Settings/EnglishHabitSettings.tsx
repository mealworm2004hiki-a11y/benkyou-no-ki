import { useStore } from '../../store';

export function EnglishHabitSettings() {
  const { categories, settings, updateSettings } = useStore();

  return (
    <div className="english-habit-settings">
      <label className="field">
        <span>英語の科目（毎日◯分を数える対象）</span>
        <select
          value={settings.englishCategoryId ?? ''}
          onChange={(e) => updateSettings({ englishCategoryId: e.target.value || null })}
        >
          <option value="">（設定しない）</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>1日の目標（分）</span>
        <input
          type="number"
          min="1"
          step="1"
          value={settings.englishDailyGoalMin}
          onChange={(e) => updateSettings({ englishDailyGoalMin: Math.max(1, Math.round(parseFloat(e.target.value) || 1)) })}
        />
      </label>
      <p className="hint">ここで選んだ科目のセッションが「毎日◯分」の連続日数になります。それ以外の科目は数学（週ストリーク）として数えます。</p>
    </div>
  );
}
