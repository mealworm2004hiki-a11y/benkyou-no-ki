import { useMemo, useState } from 'react';
import { useStore } from '../../store';
import { useGame } from '../../game/store';
import { challengeProgress, currentChallenge } from '../../game/weeklyChallenge';
import { formatMinutes } from '../../utils/date';
import { haptics, playComplete } from '../../utils/sfx';
import { CoinIcon } from '../CoinIcon';

/** 科目を問わない3種類の週替わりお題。達成するとコインがもらえる。 */
export function WeeklyChallengeCard() {
  const { sessions, lastWeekTotal } = useStore();
  const { game, claimWeeklyChallenge } = useGame();
  const [justClaimed, setJustClaimed] = useState(false);

  const challenge = useMemo(() => currentChallenge(new Date(), lastWeekTotal), [lastWeekTotal]);
  const progress = useMemo(() => challengeProgress(challenge, new Date(), sessions), [challenge, sessions]);
  const done = progress >= challenge.target;
  const claimed = game.claimedChallengeWeeks.includes(challenge.weekKey);
  const pct = Math.min(100, Math.round((progress / challenge.target) * 100));

  function handleClaim() {
    const ok = claimWeeklyChallenge(challenge.weekKey, challenge.reward);
    if (ok) {
      setJustClaimed(true);
      playComplete();
      haptics.success();
    }
  }

  const progressLabel =
    challenge.kind === 'total' ? `${formatMinutes(progress)} / ${formatMinutes(challenge.target)}` : `${progress} / ${challenge.target}`;

  return (
    <section className="challenge-card">
      <div className="challenge-head">
        <span className="challenge-title">{challenge.title}</span>
        <span className="challenge-reward">
          <CoinIcon size={15} /> +{challenge.reward}
        </span>
      </div>
      <p className="hint">{challenge.hint}</p>
      <div className="goal-progress-track">
        <div className="goal-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="challenge-foot">
        <span className="hint">{progressLabel}</span>
        {claimed || justClaimed ? (
          <span className="challenge-claimed">受け取り済み</span>
        ) : done ? (
          <button className="primary-btn challenge-claim-btn" onClick={handleClaim}>
            受け取る
          </button>
        ) : null}
      </div>
    </section>
  );
}
