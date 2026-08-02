import { useEffect, useState } from 'react';
import { useStore } from './store';
import { useGame } from './game/store';
import { HomeScreen } from './components/Home/HomeScreen';
import { TimerScreen } from './components/Timer/TimerScreen';
import { RecordsScreen } from './components/Records/RecordsScreen';
import { SettingsScreen } from './components/Settings/SettingsScreen';
import { CelebrationPopup } from './components/CelebrationPopup';
import { VillageScene } from './components/Village/VillageScene';
import { haptics, playTap, setSfxEnabled } from './utils/sfx';

type Tab = 'village' | 'home' | 'timer' | 'records' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'village', label: '村', icon: '🏯' },
  { id: 'home', label: 'ホーム', icon: '🏠' },
  { id: 'timer', label: 'タイマー', icon: '⏱' },
  { id: 'records', label: '記録', icon: '📖' },
  { id: 'settings', label: '設定', icon: '⚙️' },
];

export default function App() {
  const { settings, totalSeconds } = useStore();
  const { grantPioneerBonus } = useGame();
  const [tab, setTab] = useState<Tab>('village');

  useEffect(() => {
    document.documentElement.dataset.theme = settings.growthVisual;
  }, [settings.growthVisual]);

  // 既存の累計勉強に対する開拓ボーナスを初回だけ付与
  useEffect(() => {
    grantPioneerBonus(totalSeconds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSfxEnabled(settings.soundEnabled, settings.hapticsEnabled);
  }, [settings.soundEnabled, settings.hapticsEnabled]);

  // ボタン押下すべてに共通の手触り(タップ音+軽い振動)
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const target = (e.target as HTMLElement | null)?.closest('button:not(:disabled)');
      if (!target) return;
      playTap();
      haptics.light();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <div className="app-shell">
      <main className={`app-main ${tab === 'village' ? 'app-main-full' : ''}`}>
        {tab === 'village' && <VillageScene />}
        {tab === 'home' && <HomeScreen onGoToTimer={() => setTab('timer')} onGoToVillage={() => setTab('village')} />}
        {tab === 'timer' && <TimerScreen />}
        {tab === 'records' && <RecordsScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </main>

      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button key={t.id} className={`nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <CelebrationPopup />
    </div>
  );
}
