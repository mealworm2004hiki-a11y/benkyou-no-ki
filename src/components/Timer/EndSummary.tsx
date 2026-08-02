import { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { useGame } from '../../game/store';
import { FocusResult } from '../../types';
import { formatMinutes } from '../../utils/date';
import { haptics, playComplete, playWither } from '../../utils/sfx';
import { villageView } from '../../game/stages';
import { VillageArt } from '../Village/VillageArt';

interface Props {
  categoryId: string;
  durationSec: number;
  focusResult?: FocusResult;
  isRecord: boolean;
  streakAfter: number;
  coinsEarned: number;
  onClose: (note: string) => void;
}

export function EndSummary({ categoryId, durationSec, focusResult, isRecord, streakAfter, coinsEarned, onClose }: Props) {
  const { categories } = useStore();
  const { game } = useGame();
  const [note, setNote] = useState('');
  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? '勉強';

  useEffect(() => {
    if (focusResult === 'broken') {
      playWither();
      haptics.warn();
    } else {
      playComplete();
      haptics.success();
    }
  }, [focusResult]);

  const work = villageView(game.growthPoints).work;
  const dimmed = focusResult === 'broken';

  return (
    <div className="end-summary">
      <div className={`end-village-frame ${dimmed ? 'is-dimmed' : ''}`}>
        <VillageArt points={game.growthPoints} />
      </div>

      {dimmed ? (
        <>
          <p className="end-heading">集中が途切れてしまいました</p>
          <p className="hint">
            でも大丈夫、{categoryName}の{formatMinutes(durationSec)}はちゃんと里山に積もります。
          </p>
        </>
      ) : (
        <>
          <p className="end-heading">おつかれさま</p>
          <p className="hint">
            {categoryName} を {formatMinutes(durationSec)} がんばりました
          </p>
        </>
      )}

      {coinsEarned > 0 && (
        <div className="coin-earned">
          <span className="coin-earned-value">+{coinsEarned}</span>
          <span className="coin-earned-label">コイン{focusResult === 'completed' ? '（集中ボーナス込み）' : ''}</span>
          <span className="coin-earned-hint">
            {work ? `村で寄進すると、「${work.name}」が進みます` : '里山は満ちました'}
          </span>
        </div>
      )}

      <div className="end-badges">
        {isRecord && <span className="end-badge">自己ベスト更新</span>}
        {focusResult === 'completed' && streakAfter >= 2 && <span className="end-badge">集中{streakAfter}回連続</span>}
      </div>

      <label className="field end-note-field">
        <span>次にやることをひとこと（任意・しおりになります）</span>
        <input
          type="text"
          value={note}
          maxLength={40}
          placeholder="例: 数学p52の続きから"
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      <button className="primary-btn" onClick={() => onClose(note.trim())}>
        とじる
      </button>
    </div>
  );
}
