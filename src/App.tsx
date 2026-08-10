import { useEffect, useState } from 'react';
import { useStore } from './store';
import { useGame } from './game/store';
import { HomeScreen } from './components/Home/HomeScreen';
import { TimerScreen } from './components/Timer/TimerScreen';
import { RecordsScreen } from './components/Records/RecordsScreen';
import { SettingsScreen } from './components/Settings/SettingsScreen';
import { CelebrationPopup } from './components/CelebrationPopup';
import { VillageScene } from './components/Village/VillageScene';
import { AssetsScreen } from './components/Assets/AssetsScreen';
import { haptics, playTap, setSfxEnabled } from './utils/sfx';

// 'village' はボトムナビ(TABS)からは外れているが、ホームのカードから setTab('village') で
// 引き続き到達できるよう Tab の値としては残す。
type Tab = 'village' | 'home' | 'timer' | 'assets' | 'records' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'ホーム', icon: '🏠' },
  { id: 'timer', label: 'タイマー', icon: '⏱' },
  { id: 'assets', label: '資産', icon: '💰' },
  { id: 'records', label: '記録', icon: '📖' },
  { id: 'settings', label: '設定', icon: '⚙️' },
];

export default function App() {
  const { settings, totalSeconds } = useStore();
  const { grantPioneerBonus } = useGame();
  const [tab, setTab] = useState<Tab>('home');

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
        {tab === 'home' && (
          <HomeScreen
            onGoToTimer={() => setTab('timer')}
            onGoToVillage={() => setTab('village')}
            onGoToAssets={() => setTab('assets')}
          />
        )}
        {tab === 'timer' && <TimerScreen />}
        {tab === 'assets' && <AssetsScreen />}
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
