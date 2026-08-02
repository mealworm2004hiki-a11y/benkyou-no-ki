// 御朱印(段階到達スタンプ)の表示用ラベル。stages.ts の各段階(id1〜11)に対応する2〜3字の銘。
// id0(一本の苗木)はスタート地点であり「到達」ではないので御朱印の対象にしない。

export const STAMP_LABEL: Record<number, string> = {
  1: '初宿',
  2: '開墾',
  3: '並家',
  4: '井田',
  5: '通路',
  6: '里道',
  7: '蔵水',
  8: '棚田',
  9: '鳥居',
  10: '実り',
  11: '御神木',
};

/** 御朱印帳に並ぶ段階idの並び順(id0を除く)。 */
export const STAMP_STAGE_IDS = Object.keys(STAMP_LABEL).map(Number).sort((a, b) => a - b);
