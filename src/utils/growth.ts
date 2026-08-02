export const HOURS_PER_LEVEL = 10;
export const MAX_VISUAL_STAGE = 5;

export interface GrowthInfo {
  totalHours: number;
  level: number;
  progress: number; // 0-1, レベル内での進捗
  stage: number; // 0-5, ビジュアルの見た目段階(頭打ちあり)
  remainingHoursToNextLevel: number;
}

export function growthInfo(totalSeconds: number): GrowthInfo {
  const totalHours = totalSeconds / 3600;
  const level = Math.floor(totalHours / HOURS_PER_LEVEL);
  const progress = (totalHours - level * HOURS_PER_LEVEL) / HOURS_PER_LEVEL;
  const stage = Math.min(level, MAX_VISUAL_STAGE);
  const remainingHoursToNextLevel = Math.max(0, (level + 1) * HOURS_PER_LEVEL - totalHours);
  return { totalHours, level, progress, stage, remainingHoursToNextLevel };
}
