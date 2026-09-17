export type GrowthVisualType = 'tree' | 'piggy' | 'water';

export type TimerMode = 'simple' | 'pomodoro';

export type Condition = 'good' | 'normal' | 'tired';

export interface Category {
  id: string;
  name: string;
  color: string;
  order: number;
}

export type FocusResult = 'completed' | 'broken';

export interface Session {
  id: string;
  categoryId: string;
  startedAt: string; // ISO timestamp
  durationSec: number; // 休憩時間は含まない純粋な学習時間
  mode: TimerMode;
  focusResult?: FocusResult; // 集中モードで行った場合の結果(未設定=通常モード)
}

/** Date.getDay() の 0=日〜6=土 に対応 */
export type WeeklyGoals = [number, number, number, number, number, number, number]; // 分単位

export interface CelebratedMilestone {
  id: string;
  at: string; // ISO timestamp
}

export interface NextNote {
  text: string;
  categoryId: string;
  createdAt: string; // ISO timestamp
}

export interface IntentPlan {
  time: string; // "HH:MM"
  place: string;
  note: string;
  categoryId: string;
  dateKey: string; // この予定が対象の日(YYYY-MM-DD)
}

/** 数検ペーサーの教材。章/単元などの残量を自己設定の目標日から逆算する。 */
export interface Textbook {
  id: string;
  name: string;
  unitLabel: string; // "章" "単元" "問題" など
  total: number; // 全体量
  done: number; // 済み
  targetDate: string | null; // 自己設定の目標日(YYYY-MM-DD)。未設定なら予測のみ
  order: number;
  archived?: boolean;
  progressLog?: { at: string; done: number }[]; // done を変えた履歴(実ペース算出用)
}

export interface Settings {
  weeklyGoals: WeeklyGoals;
  growthVisual: GrowthVisualType;
  celebratedMilestones: CelebratedMilestone[];
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  ambientSoundEnabled: boolean;
  nextNote: NextNote | null;
  intentPlan: IntentPlan | null;
  // --- 大改装(2026-09)で追加 ---
  textbooks: Textbook[]; // 数検ペーサーの教材リスト
  englishCategoryId: string | null; // 「毎日5分」を数える英語の科目。他はすべて数学扱い
  englishDailyGoalMin: number; // 英語の1日の目標分数
}

export const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'math', name: '数学', color: '#5b9a5f', order: 0 },
  { id: 'english', name: '英語', color: '#4a90a4', order: 1 },
];

export const DEFAULT_SETTINGS: Settings = {
  weeklyGoals: [60, 90, 90, 90, 90, 90, 60],
  growthVisual: 'tree',
  celebratedMilestones: [],
  soundEnabled: true,
  hapticsEnabled: true,
  ambientSoundEnabled: false,
  nextNote: null,
  intentPlan: null,
  textbooks: [],
  englishCategoryId: 'english',
  englishDailyGoalMin: 5,
};
