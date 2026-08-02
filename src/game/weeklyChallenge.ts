// 週替わりお題。3種類のお題を週番号でローテーションし、達成するとコインを受け取れる。
// 科目名を決め打ちにできない(ユーザーが自由に科目を作れる)ため、
// 「合計時間」「記録した日数」「集中モード完走回数」という科目非依存の軸だけを使う。

import { Session } from '../types';
import { dateKey, startOfWeek } from '../utils/date';

export type ChallengeKind = 'total' | 'days' | 'focus';

export interface Challenge {
  kind: ChallengeKind;
  weekKey: string;
  title: string;
  hint: string;
  /** 目標値。kind='total'は秒、それ以外は回数。 */
  target: number;
  reward: number;
}

const REWARD_COINS = 300;

export function weekKeyOf(date: Date): string {
  return dateKey(startOfWeek(date));
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** 今週のお題を、先週の実績から目標値を作って決める。 */
export function currentChallenge(now: Date, lastWeekTotalSec: number): Challenge {
  const weekKey = weekKeyOf(now);
  const kinds: ChallengeKind[] = ['total', 'days', 'focus'];
  const kind = kinds[hashStr(weekKey) % kinds.length];

  if (kind === 'total') {
    const target = Math.max(60 * 60, Math.round(lastWeekTotalSec * 1.1));
    return {
      kind,
      weekKey,
      title: '今週の合計時間チャレンジ',
      hint: `今週の合計を${Math.round(target / 60)}分以上にしよう`,
      target,
      reward: REWARD_COINS,
    };
  }
  if (kind === 'days') {
    return {
      kind,
      weekKey,
      title: '記録した日数チャレンジ',
      hint: '今週、4日以上記録しよう',
      target: 4,
      reward: REWARD_COINS,
    };
  }
  return {
    kind: 'focus',
    weekKey,
    title: '集中モードチャレンジ',
    hint: '今週、集中モードを3回完走しよう',
    target: 3,
    reward: REWARD_COINS,
  };
}

/** 今週分のセッションから、お題の進捗(target と同じ単位)を出す。 */
export function challengeProgress(challenge: Challenge, now: Date, sessions: Session[]): number {
  const weekStart = startOfWeek(now);
  const thisWeek = sessions.filter((s) => new Date(s.startedAt) >= weekStart);

  if (challenge.kind === 'total') {
    return thisWeek.reduce((sum, s) => sum + s.durationSec, 0);
  }
  if (challenge.kind === 'days') {
    return new Set(thisWeek.map((s) => dateKey(new Date(s.startedAt)))).size;
  }
  return thisWeek.filter((s) => s.focusResult === 'completed').length;
}
