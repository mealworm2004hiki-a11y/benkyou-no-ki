// 里山の初期コンテンツ・マスタ定義。作物と素材、レベル(=里山の成長段階id)解禁条件。
// 収穫で得られるのは素材のみ(将来の建物・装飾の建材)。村の成長(里山ポイント)には関わらない —
// 里山ポイントは勉強で貯めたコインの寄進で得る(economy.ts)。

export interface MaterialMaster {
  id: string;
  name: string;
  emoji: string;
}

export interface CropMaster {
  id: string;
  name: string;
  emoji: string;
  seedCost: number; // コイン
  growMinutes: number; // 現実時間での生育分数
  yieldMaterialId: string; // 収穫で得る素材
  yieldAmount: number;
  /** このレベル(=里山の成長段階id)で解禁 */
  unlockLevel: number;
  /** 生育段階0/1/2のスプライト */
  sprites: [string, string, string];
}

/** 何も植わっていない畑 */
export const EMPTY_PLOT_SPRITE = 'soil.png';

export const MATERIALS: MaterialMaster[] = [
  { id: 'rice', name: '米', emoji: '🌾' },
  { id: 'daikon', name: '大根', emoji: '🥬' },
  { id: 'nasu', name: 'なす', emoji: '🍆' },
];

/**
 * 作物マスタ。序盤ほど早く育ち安い。
 * 育成が長い作物ほど1回あたりの里山ポイントが高い(収穫の積み重ねが村を育てる)。
 */
export const CROPS: CropMaster[] = [
  {
    id: 'rice',
    name: '稲',
    emoji: '🌾',
    seedCost: 30,
    growMinutes: 20,
    yieldMaterialId: 'rice',
    yieldAmount: 2,
    unlockLevel: 0,
    sprites: ['rice_1.png', 'rice_2.png', 'rice_3.png'],
  },
  {
    id: 'daikon',
    name: '大根',
    emoji: '🥬',
    seedCost: 50,
    growMinutes: 45,
    yieldMaterialId: 'daikon',
    yieldAmount: 2,
    unlockLevel: 0,
    sprites: ['veg_1.png', 'veg_2.png', 'daikon_3.png'],
  },
  {
    id: 'nasu',
    name: 'なす',
    emoji: '🍆',
    seedCost: 80,
    growMinutes: 90,
    yieldMaterialId: 'nasu',
    yieldAmount: 3,
    unlockLevel: 2,
    sprites: ['veg_1.png', 'veg_2.png', 'nasu_3.png'],
  },
];

export function cropById(id: string): CropMaster | undefined {
  return CROPS.find((c) => c.id === id);
}
export function materialById(id: string): MaterialMaster | undefined {
  return MATERIALS.find((m) => m.id === id);
}
