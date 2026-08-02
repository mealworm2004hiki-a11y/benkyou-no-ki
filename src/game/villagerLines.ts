// 村を開いたときに村人がつぶやく、ひとりごと。時間帯・ストリーク・直近の科目から
// その日いちにちだけ変わらない一言を決定的に選ぶ(毎回変わるとうるさいので)。

import { TimeBand, timeBand } from './atmosphere';

const TIME_LINES: Record<TimeBand, string[]> = {
  dawn: ['朝から精が出ますね', '今日も一日、よろしくお願いします', '朝露が気持ちいい季節です'],
  day: ['今日もいい陽気です', '畑の様子でも見ていきませんか', 'のんびりやっていきましょう'],
  evening: ['夕焼けが綺麗な時間ですね', 'そろそろ一息つく頃合いでしょうか', '西日が里山を照らしています'],
  night: ['夜更かしはほどほどに', '静かな夜ですね、灯りをともしましょう', '今日もお疲れさまでした'],
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function dateSeed(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** 直近に勉強した科目名(あれば)。null なら記録がまだ無い。 */
export function villagerLine(now: Date, streak: number, recentCategoryName: string | null): string {
  const band = timeBand(now);
  const candidates: string[] = [];

  if (streak >= 30) candidates.push(`もう${streak}日も続いているとか、たいしたものです`);
  else if (streak >= 7) candidates.push(`${streak}日連続だそうですね。よく頑張っています`);
  else if (streak === 0) candidates.push('また会えて嬉しいです。ゆっくりでいいですよ');

  if (recentCategoryName) candidates.push(`最近は「${recentCategoryName}」に精を出しているみたいですね`);

  candidates.push(...TIME_LINES[band]);

  const seed = hashStr(dateSeed(now) + band);
  return candidates[seed % candidates.length];
}
