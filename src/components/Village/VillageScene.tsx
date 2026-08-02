import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../game/store';
import { STAGES, TOTAL_POINTS, villageView, Work, WORKS } from '../../game/stages';
import { cropById, EMPTY_PLOT_SPRITE } from '../../game/masters';
import { cropProgress, cropStage } from '../../game/crops';
import { formatPointHours, pointsForDonation, POINT_DONATION_RATE } from '../../game/economy';
import { Tile } from '../../game/types';
import { haptics, playComplete, playWarn } from '../../utils/sfx';
import { PlotSheet } from './PlotSheet';
import { VillageArt } from './VillageArt';
import { VillagerChat } from './VillagerChat';
import { CoinIcon } from '../CoinIcon';

const ASSET = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;
const WORK_SEEN_KEY = 'bnk_work_seen';

export function VillageScene() {
  const { game, expandLand, nextExpansionCost, donateForGrowth } = useGame();
  const points = game.growthPoints;
  const view = useMemo(() => villageView(points), [points]);
  const { base: stage, target, work, workProgress, completed, totalWorks } = view;
  const donatable = pointsForDonation(game.coins);

  const workRemain = work ? Math.max(0, work.fromPoints + work.points - points) : 0;
  const totalRemain = Math.max(0, TOTAL_POINTS - points);
  /** 現在の段階の工程一覧(ドット表示用) */
  const stageWorks = useMemo(
    () => (work ? WORKS.filter((w) => w.stage === work.stage) : []),
    [work],
  );

  const [openTile, setOpenTile] = useState<Tile | null>(null);
  // 生育の進みを画面に反映するため定期的に再描画
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, []);

  // 所持コインが変わった瞬間(種を買う/土地を広げる等)、バッジをポップさせる
  const [coinPop, setCoinPop] = useState(false);
  const mountedCoins = useRef(true);
  useEffect(() => {
    if (mountedCoins.current) {
      mountedCoins.current = false;
      return;
    }
    setCoinPop(true);
    const t = setTimeout(() => setCoinPop(false), 420);
    return () => clearTimeout(t);
  }, [game.coins]);

  // 工程がひとつ終わるたびにお祝いを出す(段階の完成はさらに大きく)
  const [done, setDone] = useState<Work | null>(null);
  useEffect(() => {
    const raw = localStorage.getItem(WORK_SEEN_KEY);
    const seen = raw == null ? null : Number(raw);
    if (seen == null) {
      localStorage.setItem(WORK_SEEN_KEY, String(completed));
      return;
    }
    if (completed > seen) {
      localStorage.setItem(WORK_SEEN_KEY, String(completed));
      setDone(WORKS[completed - 1]);
      playComplete();
      haptics.success();
    }
  }, [completed]);

  const expCost = nextExpansionCost();

  const plots = useMemo(() => {
    return game.tiles.map((t) => {
      let sprite = EMPTY_PLOT_SPRITE;
      let ready = false;
      if (t.planting) {
        const crop = cropById(t.planting.cropId);
        const prog = cropProgress(t.planting);
        if (crop && prog) {
          sprite = crop.sprites[cropStage(prog.progress)];
          ready = prog.ready;
        }
      }
      return { tile: t, sprite, ready };
    });
  }, [game.tiles]);

  function handlePlotTap(p: (typeof plots)[number]) {
    if (!p.tile.unlocked) {
      const ok = expandLand();
      if (ok) {
        playComplete();
        haptics.success();
      } else {
        playWarn();
        haptics.warn();
      }
      return;
    }
    setOpenTile(p.tile);
  }

  function handleDonate() {
    const gained = donateForGrowth();
    if (gained > 0) {
      playComplete();
      haptics.success();
    } else {
      playWarn();
      haptics.warn();
    }
  }

  // お祝いの中身: 段階の最後の工程なら「里山が育ちました」、それ以外は工程名
  const doneStage = done && done.nthInStage === done.ofStage ? STAGES[done.stage] : null;

  return (
    <div className="village-screen">
      <div className="village-hud">
        <div className={`coin-badge ${coinPop ? 'is-pop' : ''}`}>
          <span className="coin-badge-icon">
            <CoinIcon size={24} />
          </span>
          <span className="coin-badge-value">{game.coins.toLocaleString()}</span>
        </div>
        <div className="vhud-pill vhud-level">Lv.{stage.id}</div>
      </div>

      <div className="village-art">
        <VillageArt points={points} view={view} />
      </div>

      <VillagerChat />

      <div className="village-info">
        <p className="village-stage-name">{stage.name}</p>
        {target ? <p className="hint">つぎの姿「{target.name}」を普請しています</p> : <p className="hint">{stage.headline}</p>}

        {work ? (
          <div className="village-progress">
            <div className="vprog-row">
              <span className="vprog-work">
                いま：<strong>{work.name}</strong>
              </span>
              <span className="vprog-count">
                {work.nthInStage}/{work.ofStage}工程
              </span>
            </div>
            <div className="vprog-track">
              <div className="vprog-fill" style={{ width: `${Math.round(workProgress * 100)}%` }} />
            </div>
            <div className="vprog-row vprog-remain-row">
              <span className="vprog-remain">あと{workRemain}pt</span>
              <span className="vprog-eta">{formatPointHours(workRemain)}</span>
            </div>

            <div className="work-dots" aria-label="この段階の工程">
              {stageWorks.map((w) => (
                <span
                  key={w.index}
                  className={`work-dot ${w.index < work.index ? 'done' : ''} ${w.index === work.index ? 'now' : ''}`}
                  title={w.name}
                />
              ))}
            </div>

            <p className="vprog-hint">
              貯まったコインを寄進すると里山ポイントになります（{POINT_DONATION_RATE}コイン=1pt）
            </p>
            <button className="secondary-btn donate-btn" onClick={handleDonate} disabled={donatable <= 0}>
              寄進する{donatable > 0 ? `（+${donatable}pt）` : ''}
            </button>
          </div>
        ) : (
          <p className="village-complete">里山は満ちました。ここまでよく続けましたね。</p>
        )}

        <div className="village-total">
          <div className="vtotal-row">
            <span>里山ぜんぶ</span>
            <span>
              {completed}/{totalWorks}工程・{Math.round(view.totalProgress * 100)}%
            </span>
          </div>
          <div className="vtotal-track">
            <div className="vtotal-fill" style={{ width: `${view.totalProgress * 100}%` }} />
            {STAGES.slice(1).map((s) => (
              <span key={s.id} className="vtotal-notch" style={{ left: `${(s.fromPoints / TOTAL_POINTS) * 100}%` }} />
            ))}
          </div>
          {totalRemain > 0 && <p className="vtotal-eta">満ちるまで あと{totalRemain}pt（{formatPointHours(totalRemain)}）</p>}
        </div>

        <div className="stage-dots" aria-label="村の成長段階">
          {STAGES.map((s) => (
            <span key={s.id} className={`stage-dot ${s.id <= stage.id ? 'done' : ''}`} title={s.name} />
          ))}
        </div>
      </div>

      <div className="farm-section">
        <h2 className="section-title">畑</h2>
        <p className="hint farm-intro">種はコインで買えます。育てて収穫すると建材になります。</p>
        <div className="farm-grid">
          {plots.map((p) => (
            <button
              key={p.tile.id}
              className={`farm-tile ${!p.tile.unlocked ? 'is-locked' : ''} ${p.ready ? 'is-ready' : ''}`}
              onClick={() => handlePlotTap(p)}
            >
              {p.tile.unlocked ? (
                <>
                  <img src={ASSET(p.sprite)} alt="" draggable={false} />
                  {p.ready && <span className="farm-ready-badge">✓</span>}
                </>
              ) : (
                <>
                  <span className="farm-lock-icon">🔒</span>
                  <span className="farm-lock-cost">🪙 {expCost}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {openTile && <PlotSheet tile={openTile} onClose={() => setOpenTile(null)} />}

      {done && (
        <div className="grow-overlay" onClick={() => setDone(null)}>
          <div className="grow-card" onClick={(e) => e.stopPropagation()}>
            <p className="grow-kicker">{doneStage ? '里山が育ちました' : '普請がひとつ進みました'}</p>
            <p className="grow-name">{doneStage ? doneStage.name : done.name}</p>
            <p className="hint">{doneStage ? doneStage.headline : `のこり${WORKS.length - completed}工程で里山が満ちます`}</p>
            <button className="primary-btn" onClick={() => setDone(null)}>
              見にいく
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
