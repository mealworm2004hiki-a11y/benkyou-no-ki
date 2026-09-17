import { useStore } from '../../store';

export function MathWeekCard() {
  const { mathWeekStreak, sundayDots } = useStore();
  return (
    <div className="streak-card math">
      <div className="streak-card-head">
        <span className="streak-card-title">数学の週ストリーク</span>
        <span className="streak-card-value">
          {mathWeekStreak}
          <span className="streak-card-unit">週連続</span>
        </span>
      </div>
      <p className="hint">日曜の勉強会が基本。平日にやった週もカウントされます。</p>
      <div className="sunday-dots">
        {sundayDots.map((d) => (
          <span
            key={d.key}
            className={`sunday-dot ${d.studied ? 'on' : 'off'} ${d.isThisWeek ? 'current' : ''}`}
            title={d.key}
          />
        ))}
      </div>
      <p className="sunday-dots-caption">直近8回の日曜</p>
    </div>
  );
}

export function EnglishDailyCard({ onStartEnglish }: { onStartEnglish: () => void }) {
  const { englishStreak, englishTodaySec, settings } = useStore();
  const goalMin = settings.englishDailyGoalMin;
  const todayMin = Math.round(englishTodaySec / 60);
  const doneToday = englishTodaySec > 0;

  if (!settings.englishCategoryId) {
    return (
      <div className="streak-card english">
        <div className="streak-card-head">
          <span className="streak-card-title">英語の毎日{goalMin}分</span>
        </div>
        <p className="hint">設定で「英語の科目」を選ぶと、毎日の連続日数がここに出ます。</p>
      </div>
    );
  }

  return (
    <div className={`streak-card english ${doneToday ? 'done' : ''}`}>
      <div className="streak-card-head">
        <span className="streak-card-title">英語の毎日{goalMin}分</span>
        <span className="streak-card-value">
          {englishStreak}
          <span className="streak-card-unit">日連続</span>
        </span>
      </div>
      {doneToday ? (
        <p className="english-today done">今日はOK（{todayMin}分）— 連続を守れました</p>
      ) : (
        <>
          <p className="english-today">今日はまだ。5分だけでも連続を切らさない。</p>
          <button className="primary-btn slim" onClick={onStartEnglish}>
            英語{goalMin}分を始める
          </button>
        </>
      )}
    </div>
  );
}
