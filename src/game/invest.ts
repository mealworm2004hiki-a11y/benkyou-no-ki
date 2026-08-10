// 株式/インデックス投資の銘柄プリセットと価格取得。Twelve Data (api.twelvedata.com) を使用。
// クライアント側のみの静的サイトのためAPIキーはブラウザに保存(設定画面で入力)。
// 更新は1日1回(前日終値相当)。シンボルはデモキーでは検証できないため、実キー取得後に
// このファイルの INSTRUMENTS 配列だけ直せば済むようにしてある。

export interface Instrument {
  symbol: string;
  name: string;
  kind: 'index' | 'stock';
}

export const INSTRUMENTS: Instrument[] = [
  { symbol: 'SPX', name: 'S&P500', kind: 'index' },
  { symbol: 'NI225', name: '日経平均', kind: 'index' },
  { symbol: 'AAPL', name: 'Apple', kind: 'stock' },
  { symbol: '7203', name: 'トヨタ自動車', kind: 'stock' },
];

/** 価格キャッシュが古い(今日まだ取得していない)か。dateKeyは呼び出し元でutils/date.tsのdateKey()を使う。 */
export function needsRefresh(entry: { asOf: string } | undefined, today: string): boolean {
  return !entry || entry.asOf !== today;
}

/** 1銘柄の最新価格を取得する。失敗時は例外を投げずnullを返す(呼び出し側は個別に処理する)。 */
export async function fetchPrice(symbol: string, apiKey: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const price = Number(data?.price);
    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
}
