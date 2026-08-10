import { useEffect, useState } from 'react';
import { useGame } from '../../game/store';
import { nextTier, RANK_TIERS, tierForLifetime } from '../../game/rank';
import { haptics, playUnlock } from '../../utils/sfx';

/** 現在ランクを表すメダルバッジ。画像アセット不要のSVG(CoinIcon.tsxと同じ路線)。 */
function MedalBadge() {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" className="rank-medal" aria-hidden="true">
      <defs>
        <radialGradient id="medalFace" cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="45%" stopColor="#f3c556" />
          <stop offset="100%" stopColor="#c98f2b" />
        </radialGradient>
      </defs>
      <path d="M13 15 L7 30 L14 28 L18 34 L22 22 Z" fill="var(--vermilion)" />
      <path d="M27 15 L33 30 L26 28 L22 34 L18 22 Z" fill="var(--primary-dark)" />
      <circle cx="20" cy="17" r="13" fill="url(#medalFace)" stroke="#8a5a15" strokeWidth="1.2" />
      <path d="M9 10A13.6 13.6 0 0 1 20 4.4" fill="none" stroke="#fff6d8" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function RankCard() {
  const { game, markRankSeen } = useGame();
  const tier = tierForLifetime(game.lifetimeEarned);
  const next = nextTier(game.lifetimeEarned);
  const progress = next
    ? Math.round(((game.lifetimeEarned - tier.fromLifetime) / (next.fromLifetime - tier.fromLifetime)) * 100)
    : 100;

  // 前回見た時より上のランクに到達していたら、マウント時に一度だけお祝いする。
  const [celebrateTier, setCelebrateTier] = useState<string | null>(null);
  useEffect(() => {
    if (tier.id > game.lastSeenRankId) {
      setCelebrateTier(tier.name);
      playUnlock();
      haptics.success();
      markRankSeen(tier.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="section rank-card">
      {celebrateTier && (
        <div className="celebration-overlay" onClick={() => setCelebrateTier(null)}>
          <div className="celebration-card">
            <div className="celebration-emoji">🎉</div>
            <p className="celebration-label">「{celebrateTier}」になりました！</p>
            <button className="primary-btn" onClick={() => setCelebrateTier(null)}>
              やったね！
            </button>
          </div>
        </div>
      )}
      <div className="rank-current">
        <MedalBadge />
        <span className="rank-title">{tier.name}</span>
        <span className="rank-lifetime">生涯獲得 {game.lifetimeEarned.toLocaleString()}</span>
      </div>

      {next ? (
        <>
          <div className="rank-progress-track">
            <div className="rank-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="rank-next-label">
            {next.name}まで あと{(next.fromLifetime - game.lifetimeEarned).toLocaleString()}
          </span>
        </>
      ) : (
        <span className="rank-next-label">最高位に到達しました</span>
      )}

      <ul className="rank-tier-list rank-tier-stairs">
        {RANK_TIERS.map((t) => (
          <li
            key={t.id}
            className={`rank-tier-item ${t.id < tier.id ? 'reached' : ''} ${t.id === tier.id ? 'is-current' : ''}`}
            style={{ marginLeft: `${t.id * 14}px` }}
          >
            <span className="rank-tier-name">
              {t.id < tier.id ? '✓ ' : ''}
              {t.name}
            </span>
            <span className="rank-tier-threshold">{t.fromLifetime.toLocaleString()}〜</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
