export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** 週の始まりを日曜とみなした、直近7日間(今日を含む)の開始日 */
export function startOfWeek(d: Date): Date {
  const day = d.getDay();
  return startOfDay(addDays(d, -day));
}

export function isMonday(d: Date): boolean {
  return d.getDay() === 1;
}

export function isFirstOfMonth(d: Date): boolean {
  return d.getDate() === 1;
}

/** aからbまでの経過日数(bが未来ならプラス)。日付のみで比較(時刻は無視) */
export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / msPerDay);
}

export function formatMinutes(sec: number): string {
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}分`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}
