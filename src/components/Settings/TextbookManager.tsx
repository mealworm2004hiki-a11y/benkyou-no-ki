import { useState } from 'react';
import { useStore } from '../../store';

interface NewForm {
  name: string;
  unitLabel: string;
  total: string;
  done: string;
  targetDate: string;
}

const BLANK: NewForm = { name: '', unitLabel: '章', total: '', done: '0', targetDate: '' };

export function TextbookManager() {
  const { settings, addTextbook, updateTextbook, deleteTextbook } = useStore();
  const [form, setForm] = useState<NewForm>(BLANK);

  function submitNew(e: React.FormEvent) {
    e.preventDefault();
    const total = Math.round(parseFloat(form.total));
    if (!form.name.trim() || !total || total <= 0) return;
    addTextbook({
      name: form.name,
      unitLabel: form.unitLabel,
      total,
      done: Math.max(0, Math.round(parseFloat(form.done) || 0)),
      targetDate: form.targetDate || null,
    });
    setForm(BLANK);
  }

  return (
    <div className="textbook-manager">
      <ul className="textbook-list">
        {settings.textbooks.map((t) => (
          <li key={t.id} className="textbook-item">
            <div className="textbook-item-head">
              <span className="textbook-name">{t.name}</span>
              <button className="text-btn danger" onClick={() => deleteTextbook(t.id)}>
                削除
              </button>
            </div>
            <div className="textbook-fields">
              <label className="field mini">
                <span>済み</span>
                <input
                  type="number"
                  min="0"
                  max={t.total}
                  value={t.done}
                  onChange={(e) => updateTextbook(t.id, { done: Math.max(0, Math.min(t.total, Math.round(parseFloat(e.target.value) || 0))) })}
                />
              </label>
              <label className="field mini">
                <span>全{t.unitLabel}</span>
                <input
                  type="number"
                  min="1"
                  value={t.total}
                  onChange={(e) => updateTextbook(t.id, { total: Math.max(1, Math.round(parseFloat(e.target.value) || 1)) })}
                />
              </label>
              <label className="field mini grow">
                <span>目標日</span>
                <input
                  type="date"
                  value={t.targetDate ?? ''}
                  onChange={(e) => updateTextbook(t.id, { targetDate: e.target.value || null })}
                />
              </label>
            </div>
          </li>
        ))}
        {settings.textbooks.length === 0 && <p className="empty-state">教材がまだありません。下から追加しましょう（例: 黄チャート数1A2B）。</p>}
      </ul>

      <form className="textbook-add-form" onSubmit={submitNew}>
        <p className="form-heading">教材を追加</p>
        <label className="field">
          <span>教材名</span>
          <input placeholder="例: 黄チャート数1A2B" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <div className="form-row">
          <label className="field">
            <span>数える単位</span>
            <input placeholder="章" value={form.unitLabel} onChange={(e) => setForm({ ...form, unitLabel: e.target.value })} />
          </label>
          <label className="field">
            <span>全体量</span>
            <input type="number" min="1" placeholder="20" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span>今の済み</span>
            <input type="number" min="0" value={form.done} onChange={(e) => setForm({ ...form, done: e.target.value })} />
          </label>
          <label className="field">
            <span>目標日（任意）</span>
            <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
          </label>
        </div>
        <button type="submit" className="secondary-btn">
          追加する
        </button>
      </form>
    </div>
  );
}
