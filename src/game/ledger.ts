// コイン移動を1箇所に集約するヘルパー。残高更新・履歴記録・生涯獲得額・過去最高額の
// 更新を漏れなく行うため、game/store.tsx の全ミューテータはこれを経由してcoinsを変更する。

import { GameState, LedgerEntry, LedgerReason } from './types';

export interface ApplyCoinDeltaOptions {
  note?: string;
  /** trueなら、実際に増えた分だけ lifetimeEarned に加算する(勉強由来の獲得のみ)。 */
  countsAsEarned?: boolean;
}

export function applyCoinDelta(
  g: GameState,
  delta: number,
  reason: LedgerReason,
  opts?: ApplyCoinDeltaOptions
): GameState {
  const newCoins = Math.max(0, Math.round(g.coins + delta));
  const actualDelta = newCoins - g.coins;
  const entry: LedgerEntry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    amount: actualDelta,
    reason,
    note: opts?.note,
    balanceAfter: newCoins,
  };
  return {
    ...g,
    coins: newCoins,
    ledger: [...g.ledger, entry],
    lifetimeEarned: g.lifetimeEarned + (opts?.countsAsEarned && actualDelta > 0 ? actualDelta : 0),
    allTimeHighCoins: Math.max(g.allTimeHighCoins, newCoins),
  };
}
