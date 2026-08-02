import { useState } from 'react';
import { useGame } from '../../game/store';
import { STAMP_LABEL, STAMP_STAGE_IDS } from '../../game/goshuin';
import { GoshuinStamp } from './GoshuinStamp';
import { Certificate } from './Certificate';

/** 段階(id1〜11)に到達するたびに増えていく御朱印帳。押すと節目の証明書を見返せる。 */
export function Goshuincho() {
  const { game } = useGame();
  const [openStageId, setOpenStageId] = useState<number | null>(null);
  const earnedCount = STAMP_STAGE_IDS.filter((id) => game.stampDates[id]).length;

  return (
    <section className="goshuincho">
      <div className="goshuincho-head">
        <h2 className="section-title">御朱印帳</h2>
        <span className="goshuincho-count">
          {earnedCount}/{STAMP_STAGE_IDS.length}
        </span>
      </div>
      <p className="hint">里山が一つの姿になるたびに、御朱印がもらえます。押すと証明書を見返せます。</p>
      <div className="goshuincho-grid">
        {STAMP_STAGE_IDS.map((id) => (
          <GoshuinStamp
            key={id}
            stageId={id}
            label={STAMP_LABEL[id]}
            earned={!!game.stampDates[id]}
            onClick={() => setOpenStageId(id)}
          />
        ))}
      </div>

      {openStageId != null && game.stampDates[openStageId] && (
        <Certificate stageId={openStageId} record={game.stampDates[openStageId]} onClose={() => setOpenStageId(null)} />
      )}
    </section>
  );
}
