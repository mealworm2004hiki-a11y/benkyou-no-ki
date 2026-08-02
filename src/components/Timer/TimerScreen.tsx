import { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { useGame } from '../../game/store';
import { Condition, FocusResult, TimerMode } from '../../types';
import { dateKey } from '../../utils/date';
import { isNewLongestSession, focusStreakAfter } from '../../utils/records';
import { startAmbient, stopAmbient } from '../../utils/sfx';
import { EndSummary } from './EndSummary';
import { FinishResult, useTimerEngine } from './useTimerEngine';

function formatClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const mm = String(m).padStart(2, '0');
  const sss = String(ss).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${sss}` : `${mm}:${sss}`;
}

const CONDITIONS: { id: Condition; label: string; emoji: string }[] = [
  { id: 'good', label: '元気', emoji: '😄' },
  { id: 'normal', label: 'ふつう', emoji: '🙂' },
  { id: 'tired', label: 'だるい', emoji: '😪' },
];

const CONDITION_HINT: Record<Condition, { pomodoro: string; simple: string }> = {
  good: { pomodoro: '30分作業でしっかり集中しましょう', simple: '調子がいい日。60分を目安にやってみよう' },
  normal: { pomodoro: '25分作業 → 5分休憩を繰り返します', simple: '30分くらいを目安に' },
  tired: { pomodoro: '15分作業から。まずは1サイクルでOK', simple: 'まずは15分だけでも十分えらい' },
};

interface Finished {
  categoryId: string;
  durationSec: number;
  focusResult?: FocusResult;
  isRecord: boolean;
  streakAfter: number;
  coinsEarned: number;
}

export function TimerScreen() {
  const { categories, sessions, addSession, dailyTotals, settings, setNextNote, quickStart, clearQuickStart } = useStore();
  const { earnFromSession } = useGame();
  const [mode, setMode] = useState<TimerMode>('simple');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [focusMode, setFocusMode] = useState(false);
  const [condition, setCondition] = useState<Condition>('normal');
  const [finished, setFinished] = useState<Finished | null>(null);
  const [showGoalNudge, setShowGoalNudge] = useState(false);
  const [nudgeShownFor, setNudgeShownFor] = useState<string | null>(null);

  useEffect(() => {
    if (!categories.find((c) => c.id === categoryId) && categories[0]) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const engine = useTimerEngine((result: FinishResult) => {
    const isRecord = isNewLongestSession(sessions, result.durationSec);
    const streakAfter = focusStreakAfter(sessions, result);
    addSession(result);
    const coinsEarned = earnFromSession({ durationSec: result.durationSec, mode: result.mode, focusResult: result.focusResult });
    setFinished({ categoryId: result.categoryId, durationSec: result.durationSec, focusResult: result.focusResult, isRecord, streakAfter, coinsEarned });
  });
  const { timer, start, pause, resume, stop, workElapsedSec, phaseRemainingSec, phaseTarget } = engine;

  // クイックスタート(しおり・渇いた畑・実行意図からの再開)
  useEffect(() => {
    if (!quickStart) return;
    setMode('simple');
    setFocusMode(false);
    setCategoryId(quickStart.categoryId);
    if (quickStart.autostart) {
      start('simple', quickStart.categoryId, { focusMode: false, condition: 'normal' });
    }
    clearQuickStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickStart]);

  // 集中中だけの環境音
  useEffect(() => {
    const active = !!timer && timer.status === 'running' && timer.focusMode && settings.ambientSoundEnabled;
    if (active) startAmbient();
    else stopAmbient();
    return () => stopAmbient();
  }, [timer?.status, timer?.focusMode, settings.ambientSoundEnabled]);

  const isActive = !!timer;
  const isPomodoro = timer?.mode === 'pomodoro' || (!timer && mode === 'pomodoro');

  function attemptStop() {
    if (!timer) return;
    const todayKey = dateKey(new Date());
    const todaySavedSec = dailyTotals.get(todayKey) ?? 0;
    const projectedTodaySec = todaySavedSec + workElapsedSec;
    const goalSec = settings.weeklyGoals[new Date().getDay()] * 60;
    const remaining = goalSec - projectedTodaySec;
    if (goalSec > 0 && remaining > 0 && remaining <= 5 * 60 && nudgeShownFor !== timer.startedAt) {
      setNudgeShownFor(timer.startedAt);
      setShowGoalNudge(true);
      return;
    }
    setShowGoalNudge(false);
    stop();
  }

  function closeSummary(note: string) {
    if (finished && note) {
      setNextNote({ text: note, categoryId: finished.categoryId, createdAt: new Date().toISOString() });
    }
    setFinished(null);
  }

  if (finished) {
    return (
      <div className="screen timer-screen">
        <EndSummary
          categoryId={finished.categoryId}
          durationSec={finished.durationSec}
          focusResult={finished.focusResult}
          isRecord={finished.isRecord}
          streakAfter={finished.streakAfter}
          coinsEarned={finished.coinsEarned}
          onClose={closeSummary}
        />
      </div>
    );
  }

  return (
    <div className="screen timer-screen">
      <h1 className="screen-title">タイマー</h1>

      {!isActive && (
        <div className="timer-setup">
          <div className="mode-tabs">
            <button className={mode === 'simple' ? 'tab active' : 'tab'} onClick={() => setMode('simple')}>
              シンプル
            </button>
            <button className={mode === 'pomodoro' ? 'tab active' : 'tab'} onClick={() => setMode('pomodoro')}>
              ポモドーロ
            </button>
          </div>

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

          <div className="field">
            <span>今日の調子</span>
            <div className="condition-tabs">
              {CONDITIONS.map((c) => (
                <button key={c.id} className={condition === c.id ? 'condition-btn active' : 'condition-btn'} onClick={() => setCondition(c.id)}>
                  <span className="condition-emoji">{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
            <p className="hint">{CONDITION_HINT[condition][mode]}</p>
          </div>

          <label className="focus-toggle-row">
            <div>
              <span className="focus-toggle-label">🔒 集中モード</span>
              <p className="hint">アプリを離れると里山が翳ります。離れずに完走すると特別な収穫演出。</p>
            </div>
            <input type="checkbox" className="toggle-switch" checked={focusMode} onChange={(e) => setFocusMode(e.target.checked)} />
          </label>

          <button className="primary-btn" disabled={!categoryId} onClick={() => start(mode, categoryId, { focusMode, condition })}>
            開始する
          </button>
        </div>
      )}

      {isActive && timer && (
        <div className={`timer-running ${timer.focusBroken ? 'wither' : ''}`}>
          <div className="category-badge">{categories.find((c) => c.id === timer.categoryId)?.name ?? '不明'}</div>

          {timer.focusMode && (
            <div className={`focus-badge ${timer.focusBroken ? 'broken' : ''}`}>
              {timer.focusBroken ? '🥀 集中が途切れました' : '🔒 集中中'}
            </div>
          )}

          {isPomodoro ? (
            <>
              <div className={`phase-badge phase-${timer.phase}`}>{timer.phase === 'work' ? '作業中' : '休憩中'}</div>
              <div className="clock big">{formatClock(phaseRemainingSec)}</div>
              <div className="clock-sub">/ {formatClock(phaseTarget)}</div>
              <div className="cycle-dots">
                {[0, 1, 2, 3].map((i) => {
                  const filledCount = timer.cycleCount % 4 === 0 && timer.cycleCount > 0 ? 4 : timer.cycleCount % 4;
                  return <span key={i} className={i < filledCount ? 'dot filled' : 'dot'} />;
                })}
              </div>
              <p className="hint">今回の学習合計: {formatClock(workElapsedSec)}</p>
            </>
          ) : (
            <div className="clock big">{formatClock(workElapsedSec)}</div>
          )}

          {showGoalNudge ? (
            <div className="goal-nudge">
              <p>あと少しで今日の目標達成です！続けますか？</p>
              <div className="timer-controls">
                <button
                  className="secondary-btn"
                  onClick={() => {
                    setShowGoalNudge(false);
                  }}
                >
                  5分がんばる
                </button>
                <button className="primary-btn stop-btn" onClick={() => stop()}>
                  ここで終える
                </button>
              </div>
            </div>
          ) : (
            <div className="timer-controls">
              {timer.status === 'running' ? (
                <button className="secondary-btn" onClick={pause}>
                  一時停止
                </button>
              ) : (
                <button className="secondary-btn" onClick={resume}>
                  再開
                </button>
              )}
              <button className="primary-btn stop-btn" onClick={attemptStop}>
                終了して記録
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
