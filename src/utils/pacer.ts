import { Textbook } from '../types';
import { daysBetween } from './date';

export type PaceStatus = 'done' | 'nodate' | 'behind' | 'ok' | 'unknown';

export interface PaceInfo {
  remaining: number; // 残りユニット数
  daysLeft: number | null; // 目標日まで(過ぎていればマイナス)
  neededPerWeek: number | null; // 目標日に間に合わせるのに必要な週あたりユニット
  actualPerWeek: number | null; // 直近2週間の実ペース(ログがあれば)
  status: PaceStatus;
}

/** 直近14日で進んだユニット数 → 週あたりに換算 */
function recentActualPerWeek(tb: Textbook, now: Date): number | null {
  const log = tb.progressLog;
  if (!log || log.length === 0) return null;
  // 登録から日が浅い(1週間未満)うちは、フェアな実ペースが測れないので未計測扱い
  const firstAt = new Date(log[0].at);
  const daysSinceStart = (now.getTime() - firstAt.getTime()) / (24 * 60 * 60 * 1000);
  if (daysSinceStart < 7) return null;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 14);
  // cutoff より前の最後のスナップショット(なければ最初のスナップショット)を基準にする
  let baseline: number | null = null;
  for (const e of log) {
    if (new Date(e.at) <= cutoff) baseline = e.done;
  }
  if (baseline === null) baseline = log[0].done;
  const gained = Math.max(0, tb.done - baseline);
  return gained / 2; // 2週間ぶんを週あたりに
}

export function computePace(tb: Textbook, now: Date): PaceInfo {
  const remaining = Math.max(0, tb.total - tb.done);
  const actualPerWeek = recentActualPerWeek(tb, now);

  if (remaining <= 0) {
    return { remaining: 0, daysLeft: null, neededPerWeek: null, actualPerWeek, status: 'done' };
  }
  if (!tb.targetDate) {
    return { remaining, daysLeft: null, neededPerWeek: null, actualPerWeek, status: 'nodate' };
  }

  const daysLeft = daysBetween(now, new Date(tb.targetDate));
  if (daysLeft <= 0) {
    return { remaining, daysLeft, neededPerWeek: remaining, actualPerWeek, status: 'behind' };
  }

  const weeksLeft = Math.max(daysLeft / 7, 1 / 7);
  const neededPerWeek = remaining / weeksLeft;

  let status: PaceStatus = 'unknown';
  if (actualPerWeek !== null) {
    // 実ペースに一週間ぶんの猶予マージンを持たせて判定
    status = actualPerWeek >= neededPerWeek ? 'ok' : 'behind';
  }
  return { remaining, daysLeft, neededPerWeek, actualPerWeek, status };
}

/** 目標日が一番近い(=急ぐべき)未完了の教材を返す */
export function pickUrgentTextbook(textbooks: Textbook[], now: Date): Textbook | null {
  const active = textbooks.filter((t) => !t.archived && t.total - t.done > 0);
  if (active.length === 0) return null;
  const withDate = active.filter((t) => t.targetDate);
  const pool = withDate.length > 0 ? withDate : active;
  return [...pool].sort((a, b) => {
    const da = a.targetDate ? daysBetween(now, new Date(a.targetDate)) : Infinity;
    const db = b.targetDate ? daysBetween(now, new Date(b.targetDate)) : Infinity;
    return da - db;
  })[0];
}
