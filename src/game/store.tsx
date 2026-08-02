// ゲーム状態のReactストア。既存の勉強ストア(useStore)とは別レイヤーで、
// コイン・村グリッド・在庫を管理する。勉強セッション完了時にコインを付与する。

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { loadGameState, saveGameState } from '../db';
import { GameState, Tile } from './types';
import { CoinSource, coinsForSession, pioneerBonus, pointsForDonation, POINT_DONATION_RATE } from './economy';
import { cropById } from './masters';
import { expansionCost, nextExpandableTile } from './state';
import { STAGES } from './stages';

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
    mutate((g) => ({ ...g, coins: Math.max(0, Math.round(g.coins + amount)) }));
  }, [mutate]);

  const earnFromSession = useCallback((src: CoinSource): number => {
    const earned = coinsForSession(src);
    if (earned > 0) addCoins(earned);
    return earned;
  }, [addCoins]);

  const grantPioneerBonus = useCallback((totalStudySec: number) => {
    mutate((g) => {
      if (g.pioneerBonusGranted) return g;
      const bonus = pioneerBonus(totalStudySec);
      return { ...g, coins: g.coins + bonus, pioneerBonusGranted: true };
    });
  }, [mutate]);

  const plantCrop = useCallback((tileId: string, cropId: string): boolean => {
    const g = gameRef.current;
    const crop = cropById(cropId);
    const tile = g.tiles.find((t) => t.id === tileId);
    if (!crop || !tile || !tile.unlocked || tile.planting || tile.buildingId || tile.decorationId) return false;
    if (g.coins < crop.seedCost) return false;
    mutate((gg) => ({
      ...gg,
      coins: gg.coins - crop.seedCost,
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
        ...gg,
        coins: gg.coins - spent,
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
      ...gg,
      coins: gg.coins - cost,
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
      ...gg,
      coins: gg.coins + reward,
      claimedChallengeWeeks: [...gg.claimedChallengeWeeks, weekKey],
    }));
    return true;
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
  }), [game, addCoins, earnFromSession, grantPioneerBonus, plantCrop, harvestTile, donateForGrowth, nextExpansionCost, expandLand, tileById, claimWeeklyChallenge]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameStoreValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
