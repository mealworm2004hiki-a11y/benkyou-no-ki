import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { StoreProvider } from './store';
import { GameProvider } from './game/store';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </StoreProvider>
  </StrictMode>
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      // 新しいSWが見つかったら、有効化を待たずに更新チェックだけ即実行しておく
      reg.update();
      // 一定間隔でも更新確認(PWAとして開きっぱなしでも新しいビルドに気づけるように)
      setInterval(() => reg.update(), 60 * 60 * 1000);
    });

    // 新しいSWが制御を握った瞬間、開いたままのページを1回だけ自動リロードして
    // 新しいJS/CSSを反映する(データはlocalStorage保存済みなので消えない)。
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  });
}
