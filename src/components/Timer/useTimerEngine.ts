import { useCallback, useEffect, useRef, useState } from 'react';
import { Condition, FocusResult, TimerMode } from '../../types';
import { haptics, notifyPhaseChange, playWither } from '../../utils/sfx';

const STORAGE_KEY = 'bnk_active_timer';

export type Phase = 'work' | 'break';

export interface ActiveTimer {
  mode: TimerMode;
  categoryId: string;
  startedAt: string;
  status: 'running' | 'paused';
  segmentStart: string | null;
  accumulatedWorkSec: number;
  phase: Phase;
  phaseAccumulatedSec: number;
  cycleCount: number;
  condition: Condition;
  focusMode: boolean;
  hiddenAt: string | null;
  focusBroken: boolean;
}

const WORK_SEC_BY_CONDITION: Record<Condition, number> = {
  good: 30 * 60,
  normal: 25 * 60,
  tired: 15 * 60,
};
const SHORT_BREAK_SEC = 5 * 60;
const LONG_BREAK_SEC = 15 * 60;

/** 離席してから何秒までは「トイレ・通知確認」の猶予として見逃すか */
export const FOCUS_GRACE_SEC = 12;

function phaseTargetSec(phase: Phase, cycleCount: number, condition: Condition): number {
  if (phase === 'work') return WORK_SEC_BY_CONDITION[condition];
  return cycleCount % 4 === 0 ? LONG_BREAK_SEC : SHORT_BREAK_SEC;
}

function loadActiveTimer(): ActiveTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      condition: 'normal',
      focusMode: false,
      hiddenAt: null,
      focusBroken: false,
      ...parsed,
    };
  } catch {
    return null;
  }
}

function saveActiveTimer(timer: ActiveTimer | null) {
  if (timer) localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
  else localStorage.removeItem(STORAGE_KEY);
}

export interface FinishResult {
  categoryId: string;
  startedAt: string;
  durationSec: number;
  mode: TimerMode;
  focusResult?: FocusResult;
}

export function useTimerEngine(onFinish: (result: FinishResult) => void) {
  const [timer, setTimer] = useState<ActiveTimer | null>(() => loadActiveTimer());
  const [, forceTick] = useState(0);
  const timerRef = useRef(timer);
  timerRef.current = timer;
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const t = timerRef.current;
      if (!t || t.status !== 'running') return;
      checkFocusBreak(t);
      if (t.mode !== 'pomodoro') {
        forceTick((n) => n + 1);
        return;
      }
      const elapsedInPhase = t.phaseAccumulatedSec + secondsSince(t.segmentStart);
      const target = phaseTargetSec(t.phase, t.cycleCount, t.condition);
      if (elapsedInPhase >= target) {
        transitionPhase(t);
      } else {
        forceTick((n) => n + 1);
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onVisibilityChange() {
      const t = timerRef.current;
      if (!t || t.status !== 'running' || !t.focusMode) return;
      if (document.hidden) {
        if (!t.hiddenAt) persist({ ...t, hiddenAt: new Date().toISOString() });
      } else {
        releaseWakeLockIfHeld();
        acquireWakeLock();
        if (t.hiddenAt) {
          const elapsed = secondsSince(t.hiddenAt);
          if (elapsed > FOCUS_GRACE_SEC && !t.focusBroken) {
            playWither();
            haptics.warn();
            persist({ ...t, hiddenAt: null, focusBroken: true });
          } else {
            persist({ ...t, hiddenAt: null });
          }
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  function checkFocusBreak(t: ActiveTimer) {
    if (!t.focusMode || t.focusBroken || !t.hiddenAt || !document.hidden) return;
    const elapsed = secondsSince(t.hiddenAt);
    if (elapsed > FOCUS_GRACE_SEC) {
      persist({ ...t, focusBroken: true });
    }
  }

  async function acquireWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch {
      // Wake Lock非対応・拒否時は無視(集中モード自体は動作継続)
    }
  }

  function releaseWakeLockIfHeld() {
    wakeLockRef.current?.release?.().catch(() => {});
    wakeLockRef.current = null;
  }

  function persist(next: ActiveTimer | null) {
    setTimer(next);
    saveActiveTimer(next);
  }

  function transitionPhase(t: ActiveTimer) {
    const now = new Date().toISOString();
    const flushedWork = t.phase === 'work' ? t.accumulatedWorkSec + t.phaseAccumulatedSec + secondsSince(t.segmentStart) : t.accumulatedWorkSec;
    const nextPhase: Phase = t.phase === 'work' ? 'break' : 'work';
    const nextCycleCount = t.phase === 'work' ? t.cycleCount + 1 : t.cycleCount;
    notifyPhaseChange();
    persist({
      ...t,
      accumulatedWorkSec: flushedWork,
      phase: nextPhase,
      phaseAccumulatedSec: 0,
      segmentStart: now,
      cycleCount: nextCycleCount,
    });
  }

  const start = useCallback((mode: TimerMode, categoryId: string, opts: { focusMode?: boolean; condition?: Condition } = {}) => {
    const now = new Date().toISOString();
    const focusMode = opts.focusMode ?? false;
    persist({
      mode,
      categoryId,
      startedAt: now,
      status: 'running',
      segmentStart: now,
      accumulatedWorkSec: 0,
      phase: 'work',
      phaseAccumulatedSec: 0,
      cycleCount: 0,
      condition: opts.condition ?? 'normal',
      focusMode,
      hiddenAt: null,
      focusBroken: false,
    });
    if (focusMode) acquireWakeLock();
  }, []);

  const pause = useCallback(() => {
    const t = timerRef.current;
    if (!t || t.status !== 'running') return;
    const elapsed = secondsSince(t.segmentStart);
    releaseWakeLockIfHeld();
    persist({
      ...t,
      status: 'paused',
      segmentStart: null,
      accumulatedWorkSec: t.phase === 'work' ? t.accumulatedWorkSec + elapsed : t.accumulatedWorkSec,
      phaseAccumulatedSec: t.phaseAccumulatedSec + elapsed,
    });
  }, []);

  const resume = useCallback(() => {
    const t = timerRef.current;
    if (!t || t.status !== 'paused') return;
    persist({ ...t, status: 'running', segmentStart: new Date().toISOString() });
    if (t.focusMode) acquireWakeLock();
  }, []);

  const stop = useCallback(() => {
    const t = timerRef.current;
    if (!t) return;
    const elapsed = t.status === 'running' ? secondsSince(t.segmentStart) : 0;
    const finalWorkSec = t.phase === 'work' && t.status === 'running' ? t.accumulatedWorkSec + elapsed : t.accumulatedWorkSec;
    releaseWakeLockIfHeld();
    persist(null);
    onFinish({
      categoryId: t.categoryId,
      startedAt: t.startedAt,
      durationSec: Math.round(finalWorkSec),
      mode: t.mode,
      focusResult: t.focusMode ? (t.focusBroken ? 'broken' : 'completed') : undefined,
    });
  }, [onFinish]);

  const discard = useCallback(() => {
    releaseWakeLockIfHeld();
    persist(null);
  }, []);

  const workElapsedSec = timer
    ? timer.accumulatedWorkSec + (timer.status === 'running' && timer.phase === 'work' ? secondsSince(timer.segmentStart) : 0)
    : 0;
  const phaseElapsedSec = timer
    ? timer.phaseAccumulatedSec + (timer.status === 'running' ? secondsSince(timer.segmentStart) : 0)
    : 0;
  const phaseTarget = timer ? phaseTargetSec(timer.phase, timer.cycleCount, timer.condition) : WORK_SEC_BY_CONDITION.normal;
  const phaseRemainingSec = Math.max(0, phaseTarget - phaseElapsedSec);

  return { timer, start, pause, resume, stop, discard, workElapsedSec, phaseRemainingSec, phaseTarget };
}

function secondsSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
}
