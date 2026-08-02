export type UnlockKind = 'hours' | 'streak';

export interface Decoration {
  id: string;
  name: string;
  emoji: string;
  kind: UnlockKind;
  value: number; // hours か 連続日数
}

/** 島に住みつく装飾・生き物。里山の集落がだんだん育っていくイメージ。累積時間(hours)と連続日数(streak)で解禁される。 */
export const DECORATIONS: Decoration[] = [
  { id: 'grass', name: 'わか草', emoji: '🌱', kind: 'hours', value: 0.5 },
  { id: 'hut', name: '藁葺きの家', emoji: '🛖', kind: 'hours', value: 1 },
  { id: 'white-flower', name: '白い花', emoji: '🤍', kind: 'hours', value: 2 },
  { id: 'butterfly', name: 'ちょうちょ', emoji: '🦋', kind: 'streak', value: 3 },
  { id: 'path', name: '野良道', emoji: '🪨', kind: 'hours', value: 4 },
  { id: 'mushroom', name: 'きのこ', emoji: '🍄', kind: 'hours', value: 6 },
  { id: 'pond', name: '池', emoji: '💧', kind: 'hours', value: 9 },
  { id: 'bird', name: 'ことり', emoji: '🐦', kind: 'streak', value: 7 },
  { id: 'rice-terrace', name: '棚田', emoji: '🌾', kind: 'hours', value: 12 },
  { id: 'cedar-grove', name: '杉の林', emoji: '🌲', kind: 'hours', value: 16 },
  { id: 'stone-bridge', name: '石橋', emoji: '🌉', kind: 'hours', value: 20 },
  { id: 'rabbit', name: 'うさぎ', emoji: '🐰', kind: 'streak', value: 14 },
  { id: 'lily', name: 'すいれん', emoji: '🪷', kind: 'hours', value: 25 },
  { id: 'lantern', name: 'ちょうちん', emoji: '🏮', kind: 'hours', value: 30 },
  { id: 'torii', name: '鳥居', emoji: '⛩️', kind: 'streak', value: 30 },
  { id: 'scarecrow', name: 'かかし', emoji: '🧑‍🌾', kind: 'hours', value: 40 },
  { id: 'big-rock', name: '大きな岩', emoji: '⛰️', kind: 'hours', value: 55 },
];

export function isUnlocked(deco: Decoration, totalHours: number, streakDays: number): boolean {
  return deco.kind === 'hours' ? totalHours >= deco.value : streakDays >= deco.value;
}

export function unlockedIds(totalHours: number, streakDays: number): Set<string> {
  return new Set(DECORATIONS.filter((d) => isUnlocked(d, totalHours, streakDays)).map((d) => d.id));
}

export function unlockLabel(deco: Decoration): string {
  return deco.kind === 'hours' ? `累計${deco.value}時間` : `${deco.value}日連続`;
}

/** まだ解禁されていない装飾のうち、次に手が届くものを返す */
export function nextDecoration(totalHours: number, streakDays: number): Decoration | null {
  const locked = DECORATIONS.filter((d) => !isUnlocked(d, totalHours, streakDays));
  if (locked.length === 0) return null;
  // 残り「距離」が近い順に並べる(時間と日数は別軸なので正規化して比較)
  const remaining = (d: Decoration) =>
    d.kind === 'hours' ? d.value - totalHours : (d.value - streakDays) * 2;
  return locked.sort((a, b) => remaining(a) - remaining(b))[0];
}
