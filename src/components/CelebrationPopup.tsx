import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { haptics, playUnlock } from '../utils/sfx';

export function CelebrationPopup() {
  const { pendingCelebrations, dismissCelebration } = useStore();
  const current = pendingCelebrations[0];
  const lastPlayedId = useRef<string | null>(null);

  useEffect(() => {
    if (current && current.id !== lastPlayedId.current) {
      lastPlayedId.current = current.id;
      playUnlock();
      haptics.success();
    }
  }, [current]);

  if (!current) return null;

  return (
    <div className="celebration-overlay" onClick={dismissCelebration}>
      <div className="celebration-card">
        <div className="celebration-emoji">🎉</div>
        <p className="celebration-label">{current.label}</p>
        <button className="primary-btn" onClick={dismissCelebration}>
          やったね！
        </button>
      </div>
    </div>
  );
}
