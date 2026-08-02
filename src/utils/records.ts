import { FocusResult, Session } from '../types';

export function longestSessionSec(sessions: Session[]): number {
  return sessions.reduce((max, s) => Math.max(max, s.durationSec), 0);
}

/** このセッションが過去の記録より長い自己ベストかどうか(記録が1件も無い場合は対象外) */
export function isNewLongestSession(prevSessions: Session[], durationSec: number): boolean {
  if (prevSessions.length === 0) return false;
  return durationSec > longestSessionSec(prevSessions);
}

/** 直近のセッションを終えた後の「集中モード完走」連続回数 */
export function focusStreakAfter(prevSessions: Session[], result: { focusResult?: FocusResult; startedAt: string }): number {
  const combined = [...prevSessions.filter((s) => s.focusResult), ...(result.focusResult ? [{ focusResult: result.focusResult, startedAt: result.startedAt }] : [])].sort((a, b) =>
    a.startedAt.localeCompare(b.startedAt)
  );
  let streak = 0;
  for (let i = combined.length - 1; i >= 0; i--) {
    if (combined[i].focusResult === 'completed') streak++;
    else break;
  }
  return streak;
}
