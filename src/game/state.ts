// ゲーム状態の生成・畑スロット・拡張ロジック。

import { GameState, GAME_STATE_VERSION, Tile } from './types';

/**
 * 村シーン上の畑スロット位置(8x8グリッドのu,v)。
 * 手前〜中央の耕作に向いた区画を畑として開放していく。
 */
export const FARM_SLOTS: { u: number; v: number }[] = [
  { u: 2, v: 4 },
  { u: 1, v: 4 },
  { u: 2, v: 5 },
  { u: 0, v: 5 },
  { u: 3, v: 6 },
  { u: 4, v: 6 },
  { u: 5, v: 5 },
  { u: 6, v: 6 },
  { u: 1, v: 6 },
  { u: 7, v: 7 },
  { u: 3, v: 4 },
  { u: 5, v: 6 },
];

/** 最初から使える畑の数 */
const STARTER_PLOTS = 4;

export function initialGameState(): GameState {
  const tiles: Tile[] = FARM_SLOTS.map((s, i) => ({
    id: `plot_${i}`,
    gx: s.u,
    gy: s.v,
    unlocked: i < STARTER_PLOTS,
    planting: null,
    buildingId: null,
    decorationId: null,
  }));
  return {
    version: GAME_STATE_VERSION,
    coins: 0,
    pioneerBonusGranted: false,
    tiles,
    inventory: {},
    landExpansions: 0,
    growthPoints: 0,
    stampDates: {},
    claimedChallengeWeeks: [],
  };
}

/** まだ解放されていない次の畑 */
export function nextExpandableTile(tiles: Tile[]): Tile | null {
  return tiles.find((t) => !t.unlocked) ?? null;
}

/** 次の畑を開くコイン価格。開くほど高くなる。 */
export function expansionCost(landExpansions: number): number {
  return 300 + landExpansions * 250;
}

export function emptyFieldTiles(tiles: Tile[]): Tile[] {
  return tiles.filter((t) => t.unlocked && !t.buildingId && !t.decorationId && !t.planting);
}
