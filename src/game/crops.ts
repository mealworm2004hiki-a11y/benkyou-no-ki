// 作物の現実時間による生育計算。

import { cropById } from './masters';
import { Planting } from './types';

export interface CropProgress {
  cropId: string;
  /** 0-1 の生育進捗。 */
  progress: number;
  ready: boolean;
  minutesLeft: number;
}

export function cropProgress(planting: Planting, now: number = Date.now()): CropProgress | null {
  const crop = cropById(planting.cropId);
  if (!crop) return null;
  const elapsedMin = (now - new Date(planting.plantedAt).getTime()) / 60000;
  const progress = Math.max(0, Math.min(1, elapsedMin / crop.growMinutes));
  const minutesLeft = Math.max(0, crop.growMinutes - elapsedMin);
  return { cropId: crop.id, progress, ready: progress >= 1, minutesLeft };
}

/** 生育段階(0=植えたて,1=育ち中,2=収穫可)。見た目切り替え用。 */
export function cropStage(progress: number): 0 | 1 | 2 {
  if (progress >= 1) return 2;
  if (progress >= 0.5) return 1;
  return 0;
}
