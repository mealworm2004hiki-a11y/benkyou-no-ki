const STREAK_DAYS = [3, 7, 14, 30, 50, 100, 200, 365];
const TOTAL_HOURS = [1, 5, 10, 25, 50, 100, 200, 500];

export interface Milestone {
  id: string;
  label: string;
}

export function achievedMilestones(streak: number, totalSeconds: number): Milestone[] {
  const totalHours = totalSeconds / 3600;
  const result: Milestone[] = [];
  for (const d of STREAK_DAYS) {
    if (streak >= d) result.push({ id: `streak-${d}`, label: `${d}日連続達成！` });
  }
  for (const h of TOTAL_HOURS) {
    if (totalHours >= h) result.push({ id: `hours-${h}`, label: `累計${h}時間達成！` });
  }
  return result;
}
