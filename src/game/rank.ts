// 生涯獲得コイン(lifetimeEarned)に基づく称号ランク。stages.ts の STAGES と同じ形式で管理する。
// 使っても下がらない(spend系はlifetimeEarnedに加算しないため)、勉強でどれだけ稼いだかの指標。

export interface RankTier {
  id: number;
  name: string;
  fromLifetime: number;
}

export const RANK_TIERS: RankTier[] = [
  { id: 0, name: '駆け出し', fromLifetime: 0 },
  { id: 1, name: '庶民', fromLifetime: 5000 },
  { id: 2, name: '分限者', fromLifetime: 30000 },
  { id: 3, name: '長者', fromLifetime: 100000 },
  { id: 4, name: '大富豪', fromLifetime: 300000 },
];

export function tierForLifetime(lifetimeEarned: number): RankTier {
  let current = RANK_TIERS[0];
  for (const t of RANK_TIERS) {
    if (lifetimeEarned >= t.fromLifetime) current = t;
  }
  return current;
}

export function nextTier(lifetimeEarned: number): RankTier | null {
  return RANK_TIERS.find((t) => t.fromLifetime > lifetimeEarned) ?? null;
}
