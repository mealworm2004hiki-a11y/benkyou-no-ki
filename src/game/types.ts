// 里山ビルダーのゲーム状態モデル。
// 勉強セッションはコイン(通貨)を生み、村(等尺グリッド)を育てる。

export type TileKind = 'field' | 'building' | 'decoration';

/** 作物・建物・装飾の種別マスタID(masters.tsで定義)。 */
export type CropId = string;
export type BuildingId = string;
export type MaterialId = string;

/** 畑区画に植わっている作物の状態。植え付け時刻から現実時間で生育する。 */
export interface Planting {
  cropId: CropId;
  plantedAt: string; // ISO
}

/** 村のグリッド上の1マス。座標(gx,gy)は村の等尺グリッド座標。 */
export interface Tile {
  id: string;
  /** 村シーンの配置グリッド座標 */
  gx: number;
  gy: number;
  /** このマスが解禁済みか(レベルやコイン購入で拡張)。 */
  unlocked: boolean;
  /** 空きの畑区画。植え付け可能。 */
  planting?: Planting | null;
  /** 建物が建っている場合のマスタID。 */
  buildingId?: BuildingId | null;
  /** 装飾が置かれている場合のマスタID。 */
  decorationId?: string | null;
}

/** 素材/建材の所持数。 */
export type Inventory = Record<MaterialId, number>;

export interface GameState {
  version: number;
  coins: number;
  /** 開拓ボーナスを既に付与したか(二重付与防止)。 */
  pioneerBonusGranted: boolean;
  tiles: Tile[];
  inventory: Inventory;
  /** これまでに解禁した土地区画の数(拡張購入の値付けに使う)。 */
  landExpansions: number;
  /** 収穫の積み重ね。里山の成長段階はこの値で決まる(勉強時間ではない)。 */
  growthPoints: number;
  /** 段階(stages.tsのid、0は含まない)に到達した御朱印の記録。key=stage id。 */
  stampDates: Record<number, StampRecord>;
  /** 報酬を受け取り済みの週替わりお題(週の開始日=日曜のdateKey)。二重受け取り防止用。 */
  claimedChallengeWeeks: string[];
  /** 勉強由来の累計獲得コイン。使っても減らない、ランク算出の根拠。 */
  lifetimeEarned: number;
  /** 最後に見た(お祝い済みの)ランクid。ランクアップ演出の二重表示防止用。 */
  lastSeenRankId: number;
  /** 過去最高残高。 */
  allTimeHighCoins: number;
  /** 全コイン移動の履歴。 */
  ledger: LedgerEntry[];
  /** ユーザー定義のご褒美一覧。 */
  rewards: CustomReward[];
  /** ご褒美の交換履歴。 */
  redemptions: RewardRedemption[];
  /** 保有銘柄。 */
  holdings: Holding[];
  /** 売買履歴。 */
  investTrades: InvestTrade[];
  /** 銘柄ごとの直近価格キャッシュ。 */
  priceCache: Record<string, PriceCacheEntry>;
  /** Twelve Data APIキー(ブラウザローカルのみ保存)。 */
  twelveDataApiKey?: string;
}

export interface StampRecord {
  /** 到達した日時(ISO)。 */
  earnedAt: string;
  /** 到達時点の累計勉強時間(時間)。証明書に表示する。 */
  totalHours: number;
}

/** コイン移動の理由。session/pioneer_bonus/weekly_challengeのみ lifetimeEarned に加算される。 */
export type LedgerReason =
  | 'session'
  | 'pioneer_bonus'
  | 'weekly_challenge'
  | 'plant_crop'
  | 'expand_land'
  | 'donate_growth'
  | 'reward_redeem'
  | 'invest_buy'
  | 'invest_sell'
  | 'adjust';

/** コイン移動1件の記録。通帳の推移グラフの元データになる。 */
export interface LedgerEntry {
  id: string;
  at: string; // ISO
  amount: number; // 実際に適用された符号付き差分(0クランプ後)
  reason: LedgerReason;
  note?: string;
  balanceAfter: number;
}

/** ユーザーが自分で登録するご褒美。 */
export interface CustomReward {
  id: string;
  name: string;
  cost: number;
  createdAt: string;
  /** 削除してもredemptions履歴は残すためのソフトデリート。 */
  archived?: boolean;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  name: string;
  cost: number;
  at: string;
}

/** 保有銘柄。平均取得原価法。 */
export interface Holding {
  symbol: string;
  quantity: number;
  costBasis: number;
}

export interface InvestTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  amount: number;
  at: string;
}

/** 銘柄ごとの直近取得価格キャッシュ(1日1回更新)。 */
export interface PriceCacheEntry {
  price: number;
  asOf: string; // dateKey(YYYY-MM-DD)
  fetchedAt: string; // ISO
}

export const GAME_STATE_VERSION = 1;
