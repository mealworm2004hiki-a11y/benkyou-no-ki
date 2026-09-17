import { useMemo, useState } from 'react';
import { useStore } from '../../store';
import { Session } from '../../types';
import { formatMinutes } from '../../utils/date';
import { WeeklySummary } from '../Visualize/WeeklySummary';
import { Heatmap } from '../Visualize/Heatmap';
import { SubjectBarChart } from '../Visualize/SubjectBarChart';

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}
function toTimeInput(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function combine(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

interface FormState {
  id: string | null;
  dateStr: string;
  timeStr: string;
  durationMin: string;
  categoryId: string;
}

function blankForm(categoryId: string): FormState {
  const now = new Date();
  return {
    id: null,
    dateStr: toDateInput(now.toISOString()),
    timeStr: toTimeInput(now.toISOString()),
    durationMin: '30',
    categoryId,
  };
}

export function RecordsScreen() {
  const { categories, sessions, addSession, updateSession, deleteSession } = useStore();
  const [form, setForm] = useState<FormState>(() => blankForm(categories[0]?.id ?? ''));

  const sorted = useMemo(() => [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 60), [sessions]);
  const nameById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  function startEdit(s: Session) {
    setForm({ id: s.id, dateStr: toDateInput(s.startedAt), timeStr: toTimeInput(s.startedAt), durationMin: String(Math.round(s.durationSec / 60)), categoryId: s.categoryId });
  }

  function cancelEdit() {
    setForm(blankForm(categories[0]?.id ?? ''));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const durationSec = Math.round(parseFloat(form.durationMin) * 60);
    if (!durationSec || durationSec <= 0 || !form.categoryId) return;
    const startedAt = combine(form.dateStr, form.timeStr);
    if (form.id) {
      updateSession(form.id, { startedAt, durationSec, categoryId: form.categoryId });
    } else {
      addSession({ categoryId: form.categoryId, startedAt, durationSec, mode: 'simple' });
    }
    cancelEdit();
  }

  return (
    <div className="screen records-screen">
      <h1 className="screen-title">記録</h1>

      <WeeklySummary />

      <section className="section">
        <h2 className="section-title">学習カレンダー</h2>
        <Heatmap />
      </section>

      <section className="section">
        <h2 className="section-title">科目別</h2>
        <SubjectBarChart />
      </section>

      <form className="record-form" onSubmit={submit}>
        <p className="form-heading">{form.id ? '記録を編集' : '手入力で追加'}</p>
        <div className="form-row">
          <label className="field">
            <span>日付</span>
            <input type="date" value={form.dateStr} onChange={(e) => setForm({ ...form, dateStr: e.target.value })} required />
          </label>
          <label className="field">
            <span>時刻</span>
            <input type="time" value={form.timeStr} onChange={(e) => setForm({ ...form, timeStr: e.target.value })} required />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span>時間(分)</span>
            <input type="number" min="1" step="1" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} required />
          </label>
          <label className="field">
            <span>科目</span>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="primary-btn">
            {form.id ? '更新する' : '追加する'}
          </button>
          {form.id && (
            <button type="button" className="text-btn" onClick={cancelEdit}>
              キャンセル
            </button>
          )}
        </div>
      </form>

      <ul className="record-list">
        {sorted.map((s) => (
          <li key={s.id} className="record-item">
            <div className="record-main">
              <span className="record-date">{new Date(s.startedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="record-category">{nameById.get(s.categoryId) ?? '不明'}</span>
              <span className="record-duration">{formatMinutes(s.durationSec)}</span>
            </div>
            <div className="record-actions">
              <button className="text-btn" onClick={() => startEdit(s)}>
                編集
              </button>
              <button className="text-btn danger" onClick={() => deleteSession(s.id)}>
                削除
              </button>
            </div>
          </li>
        ))}
        {sorted.length === 0 && <p className="empty-state">まだ記録がありません。タイマーを使うか、上のフォームから追加しましょう。</p>}
      </ul>
    </div>
  );
}
