import { useState } from 'react';
import { useStore } from '../../store';
import { LORE_ENTRIES, sessionsUntilNextLore, unlockedLoreCount } from '../../game/lore';

/** 学習セッションを重ねるたびに増えていく、里の便り(テキストだけの世界観)。 */
export function VillageLore() {
  const { sessions } = useStore();
  const [open, setOpen] = useState(false);
  const unlocked = unlockedLoreCount(sessions.length);
  const remain = sessionsUntilNextLore(sessions.length);

  return (
    <section className="lore-card">
      <button className="lore-head" onClick={() => setOpen((v) => !v)}>
        <span className="section-title">里の便り</span>
        <span className="lore-count">
          {unlocked}/{LORE_ENTRIES.length} {open ? '▾' : '▸'}
        </span>
      </button>
      {open && (
        <>
          <p className="hint">学習を重ねるたびに、里にまつわる短い話が届きます。</p>
          <ul className="lore-list">
            {LORE_ENTRIES.map((text, i) => (
              <li key={i} className={`lore-item ${i < unlocked ? 'is-unlocked' : 'is-locked'}`}>
                {i < unlocked ? text : '───────'}
              </li>
            ))}
          </ul>
          {remain != null && <p className="hint lore-next">あと{remain}回の学習で次の便りが届きます</p>}
        </>
      )}
    </section>
  );
}
