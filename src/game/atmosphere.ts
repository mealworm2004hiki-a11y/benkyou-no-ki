// 季節・時間帯フィルター。既存12枚の絵を増やさずに「今日は違う顔をしている」を作る。
// 実機の時計・月からCSSフィルター＋色被せ(overlay)を計算するだけで、絵そのものは変えない。

export type TimeBand = 'dawn' | 'day' | 'evening' | 'night';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export function timeBand(date: Date): TimeBand {
  const h = date.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 16) return 'day';
  if (h >= 16 && h < 19) return 'evening';
  return 'night';
}

export function season(date: Date): Season {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

interface Overlay {
  color: string;
  blend: 'multiply' | 'soft-light' | 'overlay';
}

const TIME_FILTER: Record<TimeBand, string> = {
  dawn: 'brightness(0.97) saturate(1.05)',
  day: '',
  evening: 'brightness(1.02) saturate(1.14) hue-rotate(-4deg)',
  night: 'brightness(0.6) saturate(0.72) contrast(1.08)',
};

const TIME_OVERLAY: Record<TimeBand, Overlay | null> = {
  dawn: { color: 'rgba(255, 196, 170, 0.14)', blend: 'soft-light' },
  day: null,
  evening: { color: 'rgba(255, 148, 58, 0.18)', blend: 'multiply' },
  night: { color: 'rgba(24, 32, 74, 0.4)', blend: 'multiply' },
};

const SEASON_FILTER: Record<Season, string> = {
  spring: 'saturate(1.05) hue-rotate(2deg)',
  summer: 'saturate(1.1) contrast(1.03)',
  autumn: 'sepia(0.14) saturate(1.08) hue-rotate(-6deg)',
  winter: 'saturate(0.85) hue-rotate(3deg)',
};

export interface Atmosphere {
  filter: string;
  overlay: Overlay | null;
}

/** 現在時刻・季節から見た目の演出をまとめて返す。絵は変えず、CSSだけで雰囲気を足す。 */
export function atmosphereFor(date: Date): Atmosphere {
  const tf = TIME_FILTER[timeBand(date)];
  const sf = SEASON_FILTER[season(date)];
  const filter = [tf, sf].filter(Boolean).join(' ');
  return { filter, overlay: TIME_OVERLAY[timeBand(date)] };
}
