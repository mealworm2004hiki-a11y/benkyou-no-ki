import { useStore } from '../../store';
import { computePace, pickUrgentTextbook, PaceStatus } from '../../utils/pacer';
import { Textbook } from '../../types';

const STATUS_META: Record<PaceStatus, { dot: string; label: string }> = {
  done: { dot: '🟢', label: '達成' },
  ok: { dot: '🟢', label: '間に合うペース' },
  behind: { dot: '🔴', label: '遅れ気味' },
  unknown: { dot: '🟡', label: 'ペース計測中' },
  nodate: { dot: '⚪️', label: '目標日を決めよう' },
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function TextbookMiniRow({ tb }: { tb: Textbook }) {
  const pace = computePace(tb, new Date());
  const pct = tb.total > 0 ? Math.min(100, Math.round((tb.done / tb.total) * 100)) : 0;
  return (
    <div className="pacer-mini">
      <div className="pacer-mini-head">
        <span className="pacer-mini-name">{tb.name}</span>
        <span className="pacer-mini-count">
          {tb.done}/{tb.total}
          {tb.unitLabel}
        </span>
      </div>
      <div className="goal-progress-track">
        <div className="goal-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="pacer-mini-status">
        {STATUS_META[pace.status].dot}{' '}
        {pace.status === 'done'
          ? '達成！'
          : pace.status === 'nodate'
            ? `残り${pace.remaining}${tb.unitLabel}・目標日未設定`
            : `残り${pace.remaining}${tb.unitLabel}`}
      </span>
    </div>
  );
}

export function PacerCard({ onGoToTimer }: { onGoToTimer: () => void }) {
  const { settings } = useStore();
  const active = settings.textbooks.filter((t) => !t.archived);
  const urgent = pickUrgentTextbook(settings.textbooks, new Date());

  if (active.length === 0) {
    return (
      <div className="pacer-card empty">
        <p className="pacer-hero-title">数検ペーサー</p>
        <p className="hint">設定で教材（黄チャートなど）を登録すると、試験日までのペースがここに出ます。</p>
      </div>
    );
  }

  if (!urgent) {
    // 全教材が完了
    return (
      <div className="pacer-card">
        <p className="pacer-hero-title">🎉 教材ぜんぶ完了</p>
        <p className="hint">新しい教材を設定から追加できます。</p>
      </div>
    );
  }

  const pace = computePace(urgent, new Date());
  const pct = urgent.total > 0 ? Math.min(100, Math.round((urgent.done / urgent.total) * 100)) : 0;
  const others = active.filter((t) => t.id !== urgent.id);

  return (
    <div className={`pacer-card status-${pace.status}`}>
      <div className="pacer-hero-head">
        <span className="pacer-hero-title">{urgent.name}</span>
        <span className="pacer-hero-badge">
          {STATUS_META[pace.status].dot} {STATUS_META[pace.status].label}
        </span>
      </div>

      <div className="pacer-hero-stats">
        <div className="pacer-stat">
          <span className="pacer-stat-value">{pace.remaining}</span>
          <span className="pacer-stat-label">残り{urgent.unitLabel}</span>
        </div>
        {pace.daysLeft !== null && (
          <div className="pacer-stat">
            <span className="pacer-stat-value">{pace.daysLeft >= 0 ? pace.daysLeft : `+${-pace.daysLeft}`}</span>
            <span className="pacer-stat-label">{pace.daysLeft >= 0 ? '日のこり' : '日オーバー'}</span>
          </div>
        )}
        {pace.neededPerWeek !== null && pace.daysLeft !== null && pace.daysLeft > 0 && (
          <div className="pacer-stat">
            <span className="pacer-stat-value">{round1(pace.neededPerWeek)}</span>
            <span className="pacer-stat-label">必要/週</span>
          </div>
        )}
      </div>

      <div className="goal-progress-track big">
        <div className="goal-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <p className="pacer-hero-msg">
        {pace.status === 'nodate' && '設定で目標日を決めると「間に合うか」を毎日チェックできます。'}
        {pace.status === 'behind' &&
          pace.daysLeft !== null &&
          pace.daysLeft <= 0 &&
          'そろそろ仕上げどき。今日ひと単元だけでも進めよう。'}
        {pace.status === 'behind' &&
          pace.daysLeft !== null &&
          pace.daysLeft > 0 &&
          pace.actualPerWeek !== null &&
          `いまのペースは週${round1(pace.actualPerWeek)}${urgent.unitLabel}。少し上げれば届く。`}
        {pace.status === 'unknown' && '進めた分は終了時に記録できます。まずは今日の一歩を。'}
        {pace.status === 'ok' && 'いいペース。この調子で日曜と平日にコツコツ。'}
      </p>

      <button className="primary-btn" onClick={onGoToTimer}>
        今日ぶんを始める
      </button>

      {others.length > 0 && <div className="pacer-others">{others.map((t) => <TextbookMiniRow key={t.id} tb={t} />)}</div>}
    </div>
  );
}
