// 村の成長。累計「里山ポイント」で1枚絵が育つ。
// 里山ポイントは畑仕事ではなく、勉強で貯めたコインを「寄進する」ことで得る(economy.ts の POINT_DONATION_RATE)。
// 収穫は素材集め(将来の建物・装飾の材料)用のループとして独立し、村の成長そのものには関わらない。
//
// 【2026-07-31 改訂: 普請(ふしん)システム】
// 旧設計は「12枚の絵 + 同じ絵を使い回す仮ステージ10枚」で、実際に絵が完成するのは260pt(≒289時間)。
// 学習計画(英語+数学で約1200時間)に対して早く終わりすぎ、後半のモチベーションが持たなかった。
//
// 新設計では絵を増やさず、**絵と絵のあいだを「工程(Work)」に分割**する。
// 各工程は次の絵の一部分(region)だけを下から立ち上げる/じわっと現れさせるので、
// 「土台を据える → 柱を建てる → 屋根を葺く」がそのまま見える。
// 工程内も1ptずつ連続で露出が進むため、1回の勉強ごとに必ず絵が動く。
//
// ペース: 全68工程 = 904pt。集中モード換算で 1pt ≒ 1.11時間 なので、
// 最後の絵(id11「御神木の里」)が完成するのがちょうど **約1000時間**。
// 学習計画1200時間に対して約200時間のゆとりを残している。

export interface VillageStage {
  id: number;
  /** この段階の絵が完成する累計里山ポイント */
  fromPoints: number;
  name: string;
  /** 段階が変わったときに見せる一言 */
  headline: string;
  image: string;
}

/** 画像上の矩形(0-1の正規化座標、左上原点)。null は画面全体。 */
export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 工程の見せ方。
 * - build: region を下から上へせり上げて露出。柱→屋根の「建っていく」感じ。
 * - grow: region をふわっと重ねて露出。木・花・灯り・人など「にじみ出る」もの。
 * - dissolve: 画面全体を少しずつ次の絵へ。構図がずれている絵の間(1→2, 2→3, 10→11)で使う。
 */
export type WorkMode = 'build' | 'grow' | 'dissolve';

interface WorkDef {
  name: string;
  region: Region | null;
  mode: WorkMode;
  /** この工程を終えたときの region の露出率(0-1)。同じ region を複数工程で分け合える。 */
  to: number;
  points: number;
}

export interface Work extends WorkDef {
  /** 通し番号(0始まり) */
  index: number;
  /** この工程が向かっている段階id。ベース画像は STAGES[stage - 1]。 */
  stage: number;
  /** 工程開始時の region の露出率 */
  from: number;
  /** この工程が始まる累計里山ポイント */
  fromPoints: number;
  /** 工程がその段階の何番目か(1始まり) */
  nthInStage: number;
  /** その段階の工程総数 */
  ofStage: number;
}

const R = (x: number, y: number, w: number, h: number): Region => ({ x, y, w, h });

/**
 * 段階ごとの工程表。stage番号 = 完成させようとしている絵のid。
 * region は各画像を1:1で見たときの目分量。隣り合う絵はほぼ同じ構図なので、
 * region が多少大きくても差分以外はほぼ同じ絵が重なるだけで破綻しない。
 * 各段階の最後の工程は region:null / dissolve にして、取りこぼしなく次の絵へ着地させる。
 */
const WORK_TABLE: { stage: number; works: WorkDef[] }[] = [
  // ── 段階1「最初の小屋」 4工程 × 2pt = 8pt (≒9時間)
  {
    stage: 1,
    works: [
      { name: '苗木がのびる', region: R(0.34, 0.12, 0.3, 0.36), mode: 'grow', to: 1, points: 2 },
      { name: '柱を建てる', region: R(0.5, 0.21, 0.36, 0.29), mode: 'build', to: 0.45, points: 2 },
      { name: '屋根を葺く', region: R(0.5, 0.21, 0.36, 0.29), mode: 'build', to: 1, points: 2 },
      { name: '小さな畑をひらく', region: null, mode: 'dissolve', to: 1, points: 2 },
    ],
  },
  // ── 段階2「畑をひらく」 4工程 × 3pt = 12pt
  // 1と2は構図(土台の大きさ)がずれているので全体を少しずつ移し替える。
  {
    stage: 2,
    works: [
      { name: '土をならす', region: null, mode: 'dissolve', to: 0.25, points: 3 },
      { name: '木が根を張る', region: null, mode: 'dissolve', to: 0.5, points: 3 },
      { name: '畝を立てる', region: null, mode: 'dissolve', to: 0.75, points: 3 },
      { name: '垣根を結う', region: null, mode: 'dissolve', to: 1, points: 3 },
    ],
  },
  // ── 段階3「二軒目の家」 4工程 × 4pt = 16pt
  {
    stage: 3,
    works: [
      { name: '二軒目の地をならす', region: null, mode: 'dissolve', to: 0.25, points: 4 },
      { name: '柱を建てる', region: null, mode: 'dissolve', to: 0.5, points: 4 },
      { name: '屋根を葺く', region: null, mode: 'dissolve', to: 0.75, points: 4 },
      { name: '木が大きく育つ', region: null, mode: 'dissolve', to: 1, points: 4 },
    ],
  },
  // ── 段階4「井戸と田んぼ」 5工程 × 5pt = 25pt
  {
    stage: 4,
    works: [
      { name: '井戸を掘る', region: R(0.72, 0.31, 0.2, 0.2), mode: 'build', to: 1, points: 5 },
      { name: '田の畦を切る', region: R(0.32, 0.41, 0.34, 0.22), mode: 'build', to: 0.4, points: 5 },
      { name: '水をひく', region: R(0.32, 0.41, 0.34, 0.22), mode: 'build', to: 0.75, points: 5 },
      { name: '苗を植える', region: R(0.32, 0.41, 0.34, 0.22), mode: 'build', to: 1, points: 5 },
      { name: '村人が畑に出る', region: null, mode: 'dissolve', to: 1, points: 5 },
    ],
  },
  // ── 段階5「小道がのびる」 5工程 × 7pt = 35pt
  {
    stage: 5,
    works: [
      { name: '小道を敷く', region: R(0.6, 0.52, 0.24, 0.18), mode: 'build', to: 1, points: 7 },
      { name: '石段を組む', region: R(0.2, 0.46, 0.2, 0.18), mode: 'build', to: 1, points: 7 },
      { name: '東に木を植える', region: R(0.83, 0.31, 0.17, 0.24), mode: 'grow', to: 1, points: 7 },
      { name: '西に花を植える', region: R(0.04, 0.4, 0.22, 0.22), mode: 'grow', to: 1, points: 7 },
      { name: '道が里をつなぐ', region: null, mode: 'dissolve', to: 1, points: 7 },
    ],
  },
  // ── 段階6「三軒目の家」 7工程 × 8pt = 56pt
  {
    stage: 6,
    works: [
      { name: '西の家の土台を据える', region: R(0.11, 0.45, 0.28, 0.25), mode: 'build', to: 0.3, points: 8 },
      { name: '西の家の柱と梁を組む', region: R(0.11, 0.45, 0.28, 0.25), mode: 'build', to: 0.65, points: 8 },
      { name: '西の家の屋根を葺く', region: R(0.11, 0.45, 0.28, 0.25), mode: 'build', to: 1, points: 8 },
      { name: '東の家の柱を建てる', region: R(0.6, 0.45, 0.3, 0.25), mode: 'build', to: 0.55, points: 8 },
      { name: '東の家の屋根を葺く', region: R(0.6, 0.45, 0.3, 0.25), mode: 'build', to: 1, points: 8 },
      { name: '南の畑をひらく', region: R(0.28, 0.62, 0.34, 0.23), mode: 'build', to: 1, points: 8 },
      { name: '林が茂る', region: null, mode: 'dissolve', to: 1, points: 8 },
    ],
  },
  // ── 段階7「蔵と水車」 6工程 × 11pt = 66pt
  {
    stage: 7,
    works: [
      { name: '蔵の土台を据える', region: R(0.33, 0.58, 0.25, 0.24), mode: 'build', to: 0.3, points: 11 },
      { name: '蔵の柱を建てる', region: R(0.33, 0.58, 0.25, 0.24), mode: 'build', to: 0.6, points: 11 },
      { name: '白壁を塗り瓦を葺く', region: R(0.33, 0.58, 0.25, 0.24), mode: 'build', to: 1, points: 11 },
      { name: '水路を掘る', region: R(0.38, 0.72, 0.34, 0.18), mode: 'build', to: 1, points: 11 },
      { name: '水車小屋を組む', region: R(0.48, 0.57, 0.24, 0.26), mode: 'build', to: 0.7, points: 11 },
      { name: '水車が回りだす', region: null, mode: 'dissolve', to: 1, points: 11 },
    ],
  },
  // ── 段階8「棚田の段」 6工程 × 14pt = 84pt
  {
    stage: 8,
    works: [
      { name: '田の畦を切りなおす', region: R(0.32, 0.41, 0.34, 0.21), mode: 'build', to: 0.35, points: 14 },
      { name: '一段目に水を張る', region: R(0.32, 0.41, 0.34, 0.21), mode: 'build', to: 0.6, points: 14 },
      { name: '二段目に水を張る', region: R(0.32, 0.41, 0.34, 0.21), mode: 'build', to: 0.8, points: 14 },
      { name: '三段目に水を張る', region: R(0.32, 0.41, 0.34, 0.21), mode: 'build', to: 1, points: 14 },
      { name: '桜を植える', region: R(0.78, 0.36, 0.22, 0.3), mode: 'grow', to: 1, points: 14 },
      { name: '小川が里をめぐる', region: null, mode: 'dissolve', to: 1, points: 14 },
    ],
  },
  // ── 段階9「鳥居を仰ぐ」 7工程 × 18pt = 126pt
  {
    stage: 9,
    works: [
      { name: '参道を敷く', region: R(0.37, 0.42, 0.28, 0.23), mode: 'build', to: 0.4, points: 18 },
      { name: '石灯籠を据える', region: R(0.37, 0.42, 0.28, 0.23), mode: 'build', to: 0.75, points: 18 },
      { name: '鳥居の柱を建てる', region: R(0.4, 0.32, 0.2, 0.15), mode: 'build', to: 0.5, points: 18 },
      { name: '鳥居に笠木をのせる', region: R(0.4, 0.32, 0.2, 0.15), mode: 'build', to: 1, points: 18 },
      { name: '社を建てる', region: R(0.49, 0.34, 0.17, 0.17), mode: 'build', to: 1, points: 18 },
      { name: '村人が集まる', region: R(0.08, 0.44, 0.84, 0.36), mode: 'grow', to: 1, points: 18 },
      { name: '里ににぎわいが生まれる', region: null, mode: 'dissolve', to: 1, points: 18 },
    ],
  },
  // ── 段階10「実りの季節」 8工程 × 22pt = 176pt
  {
    stage: 10,
    works: [
      { name: '北の田が色づく', region: R(0.1, 0.34, 0.36, 0.19), mode: 'grow', to: 1, points: 22 },
      { name: '中の田が色づく', region: R(0.44, 0.45, 0.24, 0.17), mode: 'grow', to: 1, points: 22 },
      { name: '石橋の橋脚を据える', region: R(0.3, 0.52, 0.2, 0.15), mode: 'build', to: 0.5, points: 22 },
      { name: '石橋がかかる', region: R(0.3, 0.52, 0.2, 0.15), mode: 'build', to: 1, points: 22 },
      { name: '御神木に注連縄を張る', region: R(0.4, 0.26, 0.22, 0.15), mode: 'grow', to: 1, points: 22 },
      { name: '西の家に灯がともる', region: R(0.11, 0.53, 0.26, 0.17), mode: 'grow', to: 1, points: 22 },
      { name: '東の家に灯がともる', region: R(0.59, 0.5, 0.3, 0.17), mode: 'grow', to: 1, points: 22 },
      { name: '里に実りの夜が来る', region: null, mode: 'dissolve', to: 1, points: 22 },
    ],
  },
  // ── 段階11「御神木の里」 12工程 × 25pt = 300pt
  // 最後の絵は構図が引きになる(土地そのものが広がる)ので、全体をゆっくり移し替える。
  // 1工程 ≒ 28時間。300ptぶん、1ptごとに絵が少しずつ立ち上がっていく最終章。
  {
    stage: 11,
    works: [
      { name: '里の外へ土地を広げる', region: null, mode: 'dissolve', to: 1 / 12, points: 25 },
      { name: '新しい地をならす', region: null, mode: 'dissolve', to: 2 / 12, points: 25 },
      { name: '北に家々が建つ', region: null, mode: 'dissolve', to: 3 / 12, points: 25 },
      { name: '東に家々が建つ', region: null, mode: 'dissolve', to: 4 / 12, points: 25 },
      { name: '桜並木を植える', region: null, mode: 'dissolve', to: 5 / 12, points: 25 },
      { name: '参道を石畳にする', region: null, mode: 'dissolve', to: 6 / 12, points: 25 },
      { name: '大きな橋を架ける', region: null, mode: 'dissolve', to: 7 / 12, points: 25 },
      { name: '水車をもう一基', region: null, mode: 'dissolve', to: 8 / 12, points: 25 },
      { name: '棚田が段を重ねる', region: null, mode: 'dissolve', to: 9 / 12, points: 25 },
      { name: '御神木が太る', region: null, mode: 'dissolve', to: 10 / 12, points: 25 },
      { name: '家々に灯がともる', region: null, mode: 'dissolve', to: 11 / 12, points: 25 },
      { name: '里山、満ちる', region: null, mode: 'dissolve', to: 1, points: 25 },
    ],
  },
];

const STAGE_META: { name: string; headline: string; image: string }[] = [
  { name: '一本の苗木', headline: '更地に苗木を植えました', image: 'village_0.webp' },
  { name: '最初の小屋', headline: '苗木のそばに小屋が建ちました', image: 'village_1.webp' },
  { name: '畑をひらく', headline: '木が伸び、畑がひらけました', image: 'village_2.webp' },
  { name: '二軒目の家', headline: '土地が広がり、家が増えました', image: 'village_3.webp' },
  { name: '井戸と田んぼ', headline: '井戸を掘り、田んぼに水を張りました', image: 'village_4.webp' },
  { name: '小道がのびる', headline: '畑のあいだに小道がのびました', image: 'village_5.webp' },
  { name: '三軒目の家', headline: '土地が広がり、道が家々をつなぎます', image: 'village_6.webp' },
  { name: '蔵と水車', headline: '蔵が建ち、水車が回りはじめました', image: 'village_7.webp' },
  { name: '棚田の段', headline: '土地が広がり、棚田が段を重ねます', image: 'village_8.webp' },
  { name: '鳥居を仰ぐ', headline: '巨木のもとに鳥居と社が立ちました', image: 'village_9.webp' },
  { name: '実りの季節', headline: '稲が黄金に色づき、灯りがともりました', image: 'village_10.webp' },
  { name: '御神木の里', headline: '御神木がそびえ、里山が満ちました', image: 'village_11.webp' },
];

function regionKey(r: Region | null): string {
  return r ? `${r.x},${r.y},${r.w},${r.h}` : 'all';
}

/** 全工程をフラットに展開し、累計ポイントと region の露出開始値を埋める。 */
function buildWorks(): { works: Work[]; stages: VillageStage[] } {
  const works: Work[] = [];
  const stages: VillageStage[] = [{ id: 0, fromPoints: 0, ...STAGE_META[0] }];
  let cursor = 0;
  let index = 0;

  for (const entry of WORK_TABLE) {
    const revealed = new Map<string, number>();
    entry.works.forEach((w, n) => {
      const key = regionKey(w.region);
      const from = revealed.get(key) ?? 0;
      revealed.set(key, w.to);
      works.push({
        ...w,
        index,
        stage: entry.stage,
        from,
        fromPoints: cursor,
        nthInStage: n + 1,
        ofStage: entry.works.length,
      });
      index += 1;
      cursor += w.points;
    });
    stages.push({ id: entry.stage, fromPoints: cursor, ...STAGE_META[entry.stage] });
  }

  return { works, stages };
}

const built = buildWorks();

/** 全工程(通し) */
export const WORKS: Work[] = built.works;
/** 12段階。fromPoints はその絵が「完成する」累計ポイント。 */
export const STAGES: VillageStage[] = built.stages;
/** 里山が満ちるのに必要な累計里山ポイント */
export const TOTAL_POINTS: number = STAGES[STAGES.length - 1].fromPoints;

export function stageForPoints(points: number): VillageStage {
  let s = STAGES[0];
  for (const st of STAGES) {
    if (points >= st.fromPoints) s = st;
    else break;
  }
  return s;
}

/** 次の段階(最終段階なら null) */
export function nextStage(points: number): VillageStage | null {
  const cur = stageForPoints(points);
  return STAGES.find((s) => s.id === cur.id + 1) ?? null;
}

/** 現在の段階から次の段階までの進捗 0-1 */
export function stageProgress(points: number): number {
  const cur = stageForPoints(points);
  const nx = nextStage(points);
  if (!nx) return 1;
  return Math.min(1, Math.max(0, (points - cur.fromPoints) / (nx.fromPoints - cur.fromPoints)));
}

/** いま進行中の工程(すべて終わっていれば null) */
export function currentWork(points: number): Work | null {
  if (points >= TOTAL_POINTS) return null;
  let w = WORKS[0];
  for (const cand of WORKS) {
    if (points >= cand.fromPoints) w = cand;
    else break;
  }
  return w;
}

/** 完了した工程数 */
export function completedWorks(points: number): number {
  return WORKS.filter((w) => points >= w.fromPoints + w.points).length;
}

/** 画面に重ねるレイヤー1枚ぶん。 */
export interface VillageLayer {
  key: string;
  region: Region | null;
  mode: WorkMode;
  /** 露出率 0-1 */
  amount: number;
}

export interface VillageView {
  /** 下敷きになる完成済みの絵 */
  base: VillageStage;
  /** いま普請中の絵(完成していれば null) */
  target: VillageStage | null;
  /** base の上に重ねる、部分的に露出した target のレイヤー */
  layers: VillageLayer[];
  work: Work | null;
  /** いまの工程の進捗 0-1 */
  workProgress: number;
  /** 全体の進捗 0-1 */
  totalProgress: number;
  completed: number;
  totalWorks: number;
}

/**
 * 累計ポイントから、いま描くべき絵の状態を組み立てる。
 * base(完成済みの絵)の上に、次の絵を region ごとに部分露出させて重ねる。
 */
export function villageView(points: number): VillageView {
  const p = Math.max(0, points);
  const work = currentWork(p);
  const completed = completedWorks(p);
  const totalProgress = Math.min(1, p / TOTAL_POINTS);

  if (!work) {
    const last = STAGES[STAGES.length - 1];
    return {
      base: last,
      target: null,
      layers: [],
      work: null,
      workProgress: 1,
      totalProgress: 1,
      completed,
      totalWorks: WORKS.length,
    };
  }

  const base = STAGES[work.stage - 1];
  const target = STAGES[work.stage];
  const workProgress = Math.min(1, Math.max(0, (p - work.fromPoints) / work.points));

  // 同じ段階の工程だけを集め、region ごとに現在の露出率を出す
  const amounts = new Map<string, VillageLayer>();
  for (const w of WORKS) {
    if (w.stage !== work.stage || w.index > work.index) continue;
    const key = regionKey(w.region);
    const amount = w.index === work.index ? w.from + (w.to - w.from) * workProgress : w.to;
    const prev = amounts.get(key);
    if (prev) prev.amount = Math.max(prev.amount, amount);
    else amounts.set(key, { key, region: w.region, mode: w.mode, amount });
  }

  return {
    base,
    target,
    layers: [...amounts.values()].filter((l) => l.amount > 0.001),
    work,
    workProgress,
    totalProgress,
    completed,
    totalWorks: WORKS.length,
  };
}
