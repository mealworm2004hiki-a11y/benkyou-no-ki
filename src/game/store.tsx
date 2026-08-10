// ゲーム状態のReactストア。既存の勉強ストア(useStore)とは別レイヤーで、
// コイン・村グリッド・在庫を管理する。勉強セッション完了時にコインを付与する。

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { loadGameState, saveGameState } from '../db';
import { GameState, Holding, InvestTrade, PriceCacheEntry, Tile } from './types';
import { CoinSource, coinsForSession, pioneerBonus, pointsForDonation, POINT_DONATION_RATE } from './economy';
import { cropById } from './masters';
import { expansionCost, nextExpandableTile } from './state';
import { STAGES } from './stages';
import { applyCoinDelta } from './ledger';

interface GameStoreValue {
  game: GameState;
  addCoins: (amount: number) => void;
  /** セッション完了でコインを付与し、獲得額を返す。 */
  earnFromSession: (src: CoinSource) => number;
  /** 既存累計に対する開拓ボーナスを一度だけ付与。 */
  grantPioneerBonus: (totalStudySec: number) => void;
  plantCrop: (tileId: string, cropId: string) => boolean;
  /** 収穫。素材が手に入る(建物・装飾の建材)。村の成長段階には関わらない。 */
  harvestTile: (tileId: string) => boolean;
  /** 所持コインを里山ポイントに寄進する。得られたポイント数を返す(寄進できるコインが無ければ0)。 */
  donateForGrowth: () => number;
  /** 次の畑を開くのに必要なコイン(解放できる畑が無ければnull)。 */
  nextExpansionCost: () => number | null;
  expandLand: () => boolean;
  tileById: (id: string) => Tile | undefined;
  /** 週替わりお題の報酬を受け取る。既に受け取り済みなら false。 */
  claimWeeklyChallenge: (weekKey: string, reward: number) => boolean;
  /** ご褒美を新規登録する。 */
  addReward: (name: string, cost: number) => void;
  /** ご褒美の名前/コストを更新する。 */
  updateReward: (id: string, patch: { name?: string; cost?: number }) => void;
  /** ご褒美を削除(ソフトデリート、履歴は残す)。 */
  archiveReward: (id: string) => void;
  /** ご褒美を交換する。コイン不足/存在しない/archived済みなら false。 */
  redeemReward: (rewardId: string) => boolean;
  /** 銘柄を買う。価格未取得/コイン不足なら false。 */
  buyHolding: (symbol: string, quantity: number) => boolean;
  /** 銘柄を売る。保有不足/価格未取得なら false。 */
  sellHolding: (symbol: string, quantity: number) => boolean;
  /** 銘柄の価格キャッシュを更新する。 */
  setPriceCache: (symbol: string, entry: PriceCacheEntry) => void;
  /** Twelve Data APIキーを設定する。 */
  setTwelveDataApiKey: (key: string | undefined) => void;
  /** ランクアップ演出を見た(表示済みにする)。 */
  markRankSeen: (rankId: number) => void;
}

const GameContext = createContext<GameStoreValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { totalSeconds } = useStore();
  const [game, setGame] = useState<GameState>(() => loadGameState());
  const gameRef = useRef(game);
  gameRef.current = game;

  // 保存はstate変化に追随
  useEffect(() => {
    saveGameState(game);
  }, [game]);

  const mutate = useCallback((fn: (g: GameState) => GameState) => {
    setGame((prev) => fn(prev));
  }, []);

  // 御朱印の後追い付与: この機能を追加する前から growthPoints が段階を超えていた人向けに、
  // 未記録の段階があればいま到達したものとして一度だけ埋める。
  const backfilled = useRef(false);
  useEffect(() => {
    if (backfilled.current) return;
    backfilled.current = true;
    mutate((gg) => {
      const missing = STAGES.filter((s) => s.id > 0 && gg.growthPoints >= s.fromPoints && !gg.stampDates[s.id]);
      if (missing.length === 0) return gg;
      const stampDates = { ...gg.stampDates };
      for (const s of missing) {
        stampDates[s.id] = { earnedAt: new Date().toISOString(), totalHours: totalSeconds / 3600 };
      }
      return { ...gg, stampDates };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addCoins = useCallback((amount: number) => {
    mutate((g) => applyCoinDelta(g, amount, 'adjust'));
  }, [mutate]);

  const earnFromSession = useCallback((src: CoinSource): number => {
    const earned = coinsForSession(src);
    if (earned > 0) mutate((g) => applyCoinDelta(g, earned, 'session', { countsAsEarned: true }));
    return earned;
  }, [mutate]);

  const grantPioneerBonus = useCallback((totalStudySec: number) => {
    mutate((g) => {
      if (g.pioneerBonusGranted) return g;
      const bonus = pioneerBonus(totalStudySec);
      return { ...applyCoinDelta(g, bonus, 'pioneer_bonus', { countsAsEarned: true }), pioneerBonusGranted: true };
    });
  }, [mutate]);

  const plantCrop = useCallback((tileId: string, cropId: string): boolean => {
    const g = gameRef.current;
    const crop = cropById(cropId);
    const tile = g.tiles.find((t) => t.id === tileId);
    if (!crop || !tile || !tile.unlocked || tile.planting || tile.buildingId || tile.decorationId) return false;
    if (g.coins < crop.seedCost) return false;
    mutate((gg) => ({
      ...applyCoinDelta(gg, -crop.seedCost, 'plant_crop', { note: crop.name }),
      tiles: gg.tiles.map((t) => (t.id === tileId ? { ...t, planting: { cropId, plantedAt: new Date().toISOString() } } : t)),
    }));
    return true;
  }, [mutate]);

  const harvestTile = useCallback((tileId: string): boolean => {
    const g = gameRef.current;
    const tile = g.tiles.find((t) => t.id === tileId);
    if (!tile || !tile.planting) return false;
    const crop = cropById(tile.planting.cropId);
    if (!crop) return false;
    mutate((gg) => {
      const inv = { ...gg.inventory };
      inv[crop.yieldMaterialId] = (inv[crop.yieldMaterialId] ?? 0) + crop.yieldAmount;
      return {
        ...gg,
        inventory: inv,
        tiles: gg.tiles.map((t) => (t.id === tileId ? { ...t, planting: null } : t)),
      };
    });
    return true;
  }, [mutate]);

  const donateForGrowth = useCallback((): number => {
    const g = gameRef.current;
    const points = pointsForDonation(g.coins);
    if (points <= 0) return 0;
    const spent = points * POINT_DONATION_RATE;
    const newPoints = g.growthPoints + points;
    // 寄進が一気に段階境界を跨ぐこともあるので、跨いだ分だけ御朱印を発行する
    const newlyReached = STAGES.filter((s) => s.id > 0 && newPoints >= s.fromPoints && g.growthPoints < s.fromPoints);
    mutate((gg) => {
      const stampDates = newlyReached.length ? { ...gg.stampDates } : gg.stampDates;
      for (const s of newlyReached) {
        if (!stampDates[s.id]) stampDates[s.id] = { earnedAt: new Date().toISOString(), totalHours: totalSeconds / 3600 };
      }
      return {
        ...applyCoinDelta(gg, -spent, 'donate_growth'),
        growthPoints: newPoints,
        stampDates,
      };
    });
    return points;
  }, [mutate, totalSeconds]);

  const nextExpansionCost = useCallback((): number | null => {
    const g = gameRef.current;
    if (!nextExpandableTile(g.tiles)) return null;
    return expansionCost(g.landExpansions);
  }, []);

  const expandLand = useCallback((): boolean => {
    const g = gameRef.current;
    const target = nextExpandableTile(g.tiles);
    if (!target) return false;
    const cost = expansionCost(g.landExpansions);
    if (g.coins < cost) return false;
    mutate((gg) => ({
      ...applyCoinDelta(gg, -cost, 'expand_land'),
      landExpansions: gg.landExpansions + 1,
      tiles: gg.tiles.map((t) => (t.id === target.id ? { ...t, unlocked: true } : t)),
    }));
    return true;
  }, [mutate]);

  const tileById = useCallback((id: string) => gameRef.current.tiles.find((t) => t.id === id), []);

  const claimWeeklyChallenge = useCallback((weekKey: string, reward: number): boolean => {
    const g = gameRef.current;
    if (g.claimedChallengeWeeks.includes(weekKey)) return false;
    mutate((gg) => ({
      ...applyCoinDelta(gg, reward, 'weekly_challenge', { countsAsEarned: true }),
      claimedChallengeWeeks: [...gg.claimedChallengeWeeks, weekKey],
    }));
    return true;
  }, [mutate]);

  const addReward = useCallback((name: string, cost: number) => {
    mutate((gg) => ({
      ...gg,
      rewards: [...gg.rewards, { id: crypto.randomUUID(), name, cost, createdAt: new Date().toISOString() }],
    }));
  }, [mutate]);

  const updateReward = useCallback((id: string, patch: { name?: string; cost?: number }) => {
    mutate((gg) => ({
      ...gg,
      rewards: gg.rewards.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, [mutate]);

  const archiveReward = useCallback((id: string) => {
    mutate((gg) => ({
      ...gg,
      rewards: gg.rewards.map((r) => (r.id === id ? { ...r, archived: true } : r)),
    }));
  }, [mutate]);

  const redeemReward = useCallback((rewardId: string): boolean => {
    const g = gameRef.current;
    const reward = g.rewards.find((r) => r.id === rewardId);
    if (!reward || reward.archived || g.coins < reward.cost) return false;
    mutate((gg) => ({
      ...applyCoinDelta(gg, -reward.cost, 'reward_redeem', { note: reward.name }),
      redemptions: [
        ...gg.redemptions,
        { id: crypto.randomUUID(), rewardId: reward.id, name: reward.name, cost: reward.cost, at: new Date().toISOString() },
      ],
    }));
    return true;
  }, [mutate]);

  const buyHolding = useCallback((symbol: string, quantity: number): boolean => {
    const g = gameRef.current;
    const cached = g.priceCache[symbol];
    if (!cached || quantity <= 0) return false;
    const cost = Math.round(quantity * cached.price);
    if (g.coins < cost) return false;
    mutate((gg) => {
      const existing = gg.holdings.find((h) => h.symbol === symbol);
      const holdings: Holding[] = existing
        ? gg.holdings.map((h) =>
            h.symbol === symbol ? { ...h, quantity: h.quantity + quantity, costBasis: h.costBasis + cost } : h
          )
        : [...gg.holdings, { symbol, quantity, costBasis: cost }];
      const trade: InvestTrade = {
        id: crypto.randomUUID(),
        symbol,
        side: 'buy',
        quantity,
        price: cached.price,
        amount: cost,
        at: new Date().toISOString(),
      };
      return {
        ...applyCoinDelta(gg, -cost, 'invest_buy', { note: symbol }),
        holdings,
        investTrades: [...gg.investTrades, trade],
      };
    });
    return true;
  }, [mutate]);

  const sellHolding = useCallback((symbol: string, quantity: number): boolean => {
    const g = gameRef.current;
    const cached = g.priceCache[symbol];
    const holding = g.holdings.find((h) => h.symbol === symbol);
    if (!cached || !holding || quantity <= 0 || quantity > holding.quantity) return false;
    const proceeds = Math.round(quantity * cached.price);
    mutate((gg) => {
      const h = gg.holdings.find((x) => x.symbol === symbol)!;
      const soldRatio = quantity / h.quantity;
      const remainingQuantity = h.quantity - quantity;
      const remainingCostBasis = h.costBasis * (1 - soldRatio);
      const holdings =
        remainingQuantity > 1e-9
          ? gg.holdings.map((x) => (x.symbol === symbol ? { ...x, quantity: remainingQuantity, costBasis: remainingCostBasis } : x))
          : gg.holdings.filter((x) => x.symbol !== symbol);
      const trade: InvestTrade = {
        id: crypto.randomUUID(),
        symbol,
        side: 'sell',
        quantity,
        price: cached.price,
        amount: proceeds,
        at: new Date().toISOString(),
      };
      return {
        ...applyCoinDelta(gg, proceeds, 'invest_sell', { note: symbol }),
        holdings,
        investTrades: [...gg.investTrades, trade],
      };
    });
    return true;
  }, [mutate]);

  const setPriceCache = useCallback((symbol: string, entry: PriceCacheEntry) => {
    mutate((gg) => ({ ...gg, priceCache: { ...gg.priceCache, [symbol]: entry } }));
  }, [mutate]);

  const setTwelveDataApiKey = useCallback((key: string | undefined) => {
    mutate((gg) => ({ ...gg, twelveDataApiKey: key }));
  }, [mutate]);

  const markRankSeen = useCallback((rankId: number) => {
    mutate((gg) => (rankId > gg.lastSeenRankId ? { ...gg, lastSeenRankId: rankId } : gg));
  }, [mutate]);

  const value = useMemo<GameStoreValue>(() => ({
    game,
    addCoins,
    earnFromSession,
    grantPioneerBonus,
    plantCrop,
    harvestTile,
    donateForGrowth,
    nextExpansionCost,
    expandLand,
    tileById,
    claimWeeklyChallenge,
    addReward,
    updateReward,
    archiveReward,
    redeemReward,
    buyHolding,
    sellHolding,
    setPriceCache,
    setTwelveDataApiKey,
    markRankSeen,
  }), [
    game, addCoins, earnFromSession, grantPioneerBonus, plantCrop, harvestTile, donateForGrowth,
    nextExpansionCost, expandLand, tileById, claimWeeklyChallenge,
    addReward, updateReward, archiveReward, redeemReward, buyHolding, sellHolding, setPriceCache, setTwelveDataApiKey, markRankSeen,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameStoreValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
