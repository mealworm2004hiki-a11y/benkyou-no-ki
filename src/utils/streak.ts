import { dateKey, addDays } from './date';

/** dailyTotals: dateKey -> 秒数。今日を含む連続記録日数を返す */
export function calcStreak(dailyTotals: Map<string, number>, today: Date): number {
  let streak = 0;
  let cursor = new Date(today);

  // 今日まだ記録が無い場合は、昨日からのストリークを継続表示する
  if ((dailyTotals.get(dateKey(cursor)) ?? 0) <= 0) {
    cursor = addDays(cursor, -1);
  }

  while ((dailyTotals.get(dateKey(cursor)) ?? 0) > 0) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
