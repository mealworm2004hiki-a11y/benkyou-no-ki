import { useStore } from '../../store';

export function SoundSettings() {
  const { settings, updateSettings } = useStore();

  return (
    <div className="sound-settings">
      <label className="toggle-row">
        <span>効果音</span>
        <input type="checkbox" className="toggle-switch" checked={settings.soundEnabled} onChange={(e) => updateSettings({ soundEnabled: e.target.checked })} />
      </label>
      <label className="toggle-row">
        <span>振動フィードバック</span>
        <input type="checkbox" className="toggle-switch" checked={settings.hapticsEnabled} onChange={(e) => updateSettings({ hapticsEnabled: e.target.checked })} />
      </label>
      <label className="toggle-row">
        <span>集中中の環境音</span>
        <input type="checkbox" className="toggle-switch" checked={settings.ambientSoundEnabled} onChange={(e) => updateSettings({ ambientSoundEnabled: e.target.checked })} />
      </label>
    </div>
  );
}
