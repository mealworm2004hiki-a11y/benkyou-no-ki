import { useState } from 'react';
import { useGame } from '../../game/store';

export function InvestApiKeySettings() {
  const { game, setTwelveDataApiKey } = useGame();
  const [value, setValue] = useState(game.twelveDataApiKey ?? '');

  function submit() {
    setTwelveDataApiKey(value.trim() || undefined);
  }

  return (
    <div className="invest-api-key-settings">
      <input
        className="invest-api-key-input"
        type="password"
        placeholder="Twelve Data APIキー"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={submit}
      />
      <p className="hint">
        投資機能の株価取得に使う無料APIキーです(<a href="https://twelvedata.com/pricing" target="_blank" rel="noreferrer">Twelve Data</a>で無料登録)。
        このアプリにはサーバーが無いため、キーはこのブラウザのlocalStorageにのみ保存され、価格取得のたびにTwelve Dataへ直接送信されます。
      </p>
    </div>
  );
}
