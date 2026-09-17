import { Session } from '../types';
import { dateKey, addDays, startOfWeek, startOfDay } from './date';

/** 英語(=englishCategoryId)のセッションがある日の集合 */
function englishDayKeys(sessions: Session[], englishCategoryId: string | null): Set<string> {
  const set = new Set<string>();
  if (!englishCategoryId) return set;
  for (const s of sessions) {
    if (s.categoryId === englishCategoryId && s.durationSec > 0) {
      set.add(dateKey(new Date(s.startedAt)));
    }
  }
  return set;
}

/** 数学(=英語以外)のセッションがある「週(その週の日曜)」キーの集合 */
function mathWeekKeys(sessions: Session[], englishCategoryId: string | null): Set<string> {
  const set = new Set<string>();
  for (const s of sessions) {
    if (s.durationSec <= 0) continue;
    if (englishCategoryId && s.categoryId === englishCategoryId) continue;
    set.add(dateKey(startOfWeek(new Date(s.startedAt))));
  }
  return set;
}

/** 英語の連続日数(今日まだなら昨日からを継続表示) */
export function englishDailyStreak(sessions: Session[], englishCategoryId: string | null, today: Date): number {
  const days = englishDayKeys(sessions, englishCategoryId);
  let streak = 0;
  let cursor = startOfDay(today);
  if (!days.has(dateKey(cursor))) cursor = addDays(cursor, -1);
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** 数学の連続週数(今週まだなら先週からを継続表示) */
export function mathWeeklyStreak(sessions: Session[], englishCategoryId: string | null, today: Date): number {
  const weeks = mathWeekKeys(sessions, englishCategoryId);
  let streak = 0;
  let cursor = startOfWeek(today);
  if (!weeks.has(dateKey(cursor))) cursor = addDays(cursor, -7);
  while (weeks.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -7);
  }
  return streak;
}

/** 英語を今日やった秒数 */
export function englishSecondsToday(sessions: Session[], englishCategoryId: string | null, today: Date): number {
  if (!englishCategoryId) return 0;
  const key = dateKey(today);
  let sec = 0;
  for (const s of sessions) {
    if (s.categoryId === englishCategoryId && dateKey(new Date(s.startedAt)) === key) sec += s.durationSec;
  }
  return sec;
}

export interface SundayDot {
  key: string; // その日曜のdateKey
  studied: boolean; // その日曜に数学の記録があったか
  isThisWeek: boolean;
}

/** 直近 count 個の日曜について、数学の記録があったかを返す(古い→新しい順) */
export function recentSundays(sessions: Session[], englishCategoryId: string | null, count: number, today: Date): SundayDot[] {
  const mathDayKeys = new Set<string>();
  for (const s of sessions) {
    if (s.durationSec <= 0) continue;
    if (englishCategoryId && s.categoryId === englishCategoryId) continue;
    mathDayKeys.add(dateKey(new Date(s.startedAt)));
  }
  const thisSunday = startOfWeek(today); // 週の始まり=日曜
  const dots: SundayDot[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = addDays(thisSunday, -7 * i);
    const key = dateKey(d);
    dots.push({ key, studied: mathDayKeys.has(key), isThisWeek: i === 0 });
  }
  return dots;
}
