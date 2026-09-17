import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store';
import { FocusResult } from '../../types';
import { formatMinutes } from '../../utils/date';
import { haptics, playComplete, playWither } from '../../utils/sfx';

interface Props {
  categoryId: string;
  durationSec: number;
  focusResult?: FocusResult;
  isRecord: boolean;
  streakAfter: number;
  onClose: (note: string) => void;
}

export function EndSummary({ categoryId, durationSec, focusResult, isRecord, streakAfter, onClose }: Props) {
  const { categories, settings, setTextbookDone } = useStore();
  const [note, setNote] = useState('');
  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? '勉強';

  const isEnglish = settings.englishCategoryId === categoryId;
  const activeTextbooks = useMemo(() => settings.textbooks.filter((t) => !t.archived), [settings.textbooks]);
  const showProgress = !isEnglish && activeTextbooks.length > 0;
  const [progressTbId, setProgressTbId] = useState(activeTextbooks[0]?.id ?? '');
  const [advanced, setAdvanced] = useState('0');

  useEffect(() => {
    if (focusResult === 'broken') {
      playWither();
      haptics.warn();
    } else {
      playComplete();
      haptics.success();
    }
  }, [focusResult]);

  const dimmed = focusResult === 'broken';

  function handleClose() {
    const n = Math.round(parseFloat(advanced));
    if (showProgress && progressTbId && n > 0) {
      const tb = activeTextbooks.find((t) => t.id === progressTbId);
      if (tb) setTextbookDone(tb.id, tb.done + n);
    }
    onClose(note.trim());
  }

  const selectedTb = activeTextbooks.find((t) => t.id === progressTbId);

  return (
    <div className="end-summary">
      {dimmed ? (
        <>
          <p className="end-heading">集中が途切れてしまいました</p>
          <p className="hint">でも {categoryName} の {formatMinutes(durationSec)} はちゃんと記録に残ります。</p>
        </>
      ) : (
        <>
          <p className="end-heading">おつかれさま</p>
          <p className="hint">
            {categoryName} を {formatMinutes(durationSec)} がんばりました
          </p>
        </>
      )}

      <div className="end-badges">
        {isRecord && <span className="end-badge">自己ベスト更新</span>}
        {focusResult === 'completed' && streakAfter >= 2 && <span className="end-badge">集中{streakAfter}回連続</span>}
      </div>

      {showProgress && (
        <div className="end-progress">
          <p className="end-progress-title">今日はどこまで進んだ？</p>
          <div className="end-progress-row">
            <select value={progressTbId} onChange={(e) => setProgressTbId(e.target.value)}>
              {activeTextbooks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}（{t.done}/{t.total}{t.unitLabel}）
                </option>
              ))}
            </select>
            <div className="end-progress-input">
              <span>+</span>
              <input
                type="number"
                min="0"
                step="1"
                value={advanced}
                onChange={(e) => setAdvanced(e.target.value)}
              />
              <span>{selectedTb?.unitLabel ?? '章'}</span>
            </div>
          </div>
          <p className="hint">進んでなければ 0 のままでOK。</p>
        </div>
      )}

      <label className="field end-note-field">
        <span>次にやることをひとこと（任意・しおりになります）</span>
        <input
          type="text"
          value={note}
          maxLength={40}
          placeholder="例: 対数関数の続きから"
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      <button className="primary-btn" onClick={handleClose}>
        とじる
      </button>
    </div>
  );
}
