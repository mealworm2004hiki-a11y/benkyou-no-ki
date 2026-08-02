import { useState } from 'react';
import { useStore } from '../../store';
import { dateKey } from '../../utils/date';

function nowTimeInput(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 予定時刻の前後どれくらいをリマインド表示の対象とするか(分) */
const REMIND_BEFORE_MIN = 60;
const REMIND_AFTER_MIN = 180;

export function IntentPlanner({ onGoToTimer }: { onGoToTimer: () => void }) {
  const { settings, categories, dailyTotals, setIntentPlan, requestQuickStart } = useStore();
  const todayKey = dateKey(new Date());
  const plan = settings.intentPlan && settings.intentPlan.dateKey === todayKey ? settings.intentPlan : null;
  const todaySec = dailyTotals.get(todayKey) ?? 0;

  const [time, setTime] = useState(nowTimeInput());
  const [place, setPlace] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [open, setOpen] = useState(false);

  if (plan && todaySec === 0) {
    const [h, m] = plan.time.split(':').map(Number);
    const planMinutes = h * 60 + m;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const withinWindow = nowMinutes >= planMinutes - REMIND_BEFORE_MIN && nowMinutes <= planMinutes + REMIND_AFTER_MIN;
    if (withinWindow) {
      const categoryName = categories.find((c) => c.id === plan.categoryId)?.name ?? '勉強';
      return (
        <div className="banner-card intent-banner">
          <div className="banner-icon">🌱</div>
          <div className="banner-body">
            <p className="banner-title">
              {plan.time}・{plan.place || 'いつもの場所'}で{plan.note || categoryName}
            </p>
            <p className="hint">決めた予定、はじめる時間です</p>
          </div>
          <div className="banner-actions">
            <button
              className="primary-btn"
              onClick={() => {
                requestQuickStart(plan.categoryId, true);
                onGoToTimer();
              }}
            >
              はじめる
            </button>
            <button className="text-btn" onClick={() => setIntentPlan(null)}>
              取り消す
            </button>
          </div>
        </div>
      );
    }
  }

  if (plan) return null;

  if (!open) {
    return (
      <button className="planner-open-card" onClick={() => setOpen(true)}>
        🌱 今日の予定を決める（いつ・どこで・何を）
      </button>
    );
  }

  return (
    <div className="planner-card">
      <p className="form-heading">今日の予定を決める</p>
      <div className="form-row">
        <label className="field">
          <span>いつ</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <label className="field">
          <span>どこで</span>
          <input type="text" placeholder="自室・図書館など" value={place} onChange={(e) => setPlace(e.target.value)} maxLength={20} />
        </label>
      </div>
      <div className="form-row">
        <label className="field">
          <span>何を</span>
          <input type="text" placeholder="英単語・数学の続きなど" value={note} onChange={(e) => setNote(e.target.value)} maxLength={30} />
        </label>
        <label className="field">
          <span>科目</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-actions">
        <button
          className="primary-btn"
          onClick={() => {
            setIntentPlan({ time, place: place.trim(), note: note.trim(), categoryId, dateKey: todayKey });
            setOpen(false);
          }}
        >
          決めた！
        </button>
        <button className="text-btn" onClick={() => setOpen(false)}>
          やめる
        </button>
      </div>
    </div>
  );
}
