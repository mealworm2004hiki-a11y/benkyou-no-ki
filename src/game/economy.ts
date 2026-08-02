// 勉強→コインの変換ロジック。集中モード完走にボーナス、手入力は減額。
// レートは全てここに集約し、後からチューニングしやすくする。

import { FocusResult, TimerMode } from '../types';

/** 基本レート: 勉強1分あたりのコイン。 */
export const COINS_PER_MINUTE = 10;
/** 集中モード完走の倍率。 */
export const FOCUS_MULTIPLIER = 1.5;
/** 手入力の倍率(オフライン勉強を一応救うが集中を得にする)。 */
export const MANUAL_MULTIPLIER = 0.5;

/**
 * 里山ポイントへの寄進レート: このコインで1ポイント。
 * 集中1時間≈900コインなので、フル集中換算で約1.1時間の勉強=1ポイント。
 * 全904pt(stages.ts の TOTAL_POINTS)で里山が満ちる = 約1000時間。
 */
export const POINT_DONATION_RATE = 1000;

/** 寄進できるコインから得られる里山ポイント数。 */
export function pointsForDonation(coins: number): number {
  return Math.floor(coins / POINT_DONATION_RATE);
}

/**
 * 1里山ポイントに相当する勉強時間(集中モード換算)。
 * 手入力(×0.5)や通常タイマー(×1.0)ならこれより長くかかる = あくまで最短の目安。
 */
export const HOURS_PER_POINT = POINT_DONATION_RATE / (COINS_PER_MINUTE * FOCUS_MULTIPLIER * 60);

/** ポイントを「約◯時間」の目安文字列に。 */
export function formatPointHours(points: number): string {
  const h = points * HOURS_PER_POINT;
  if (h < 1) return `約${Math.max(10, Math.round(h * 60))}分`;
  if (h < 10) return `約${h.toFixed(1)}時間`;
  return `約${Math.round(h)}時間`;
}

export interface CoinSource {
  durationSec: number;
  mode: TimerMode;
  focusResult?: FocusResult;
  /** タイマー計測でなく手入力で追加された記録か。 */
  manual?: boolean;
}

/** セッション1件が生むコインを計算する。 */
export function coinsForSession(src: CoinSource): number {
  const minutes = src.durationSec / 60;
  let multiplier = 1;
  if (src.manual) {
    multiplier = MANUAL_MULTIPLIER;
  } else if (src.focusResult === 'completed') {
    multiplier = FOCUS_MULTIPLIER;
  }
  return Math.round(minutes * COINS_PER_MINUTE * multiplier);
}

/**
 * 既存の累計勉強時間に対する「開拓ボーナス」コイン。
 * 過去分をフル換算すると多すぎるので控えめに(基本レートの15%相当)。
 */
export function pioneerBonus(totalStudySec: number): number {
  const minutes = totalStudySec / 60;
  return Math.round(minutes * COINS_PER_MINUTE * 0.15);
}
