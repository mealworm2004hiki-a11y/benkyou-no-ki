import { useMemo } from 'react';
import { useStore } from '../../store';
import { formatMinutes } from '../../utils/date';
import { DECORATIONS } from '../../utils/decorations';

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function WeeklyDigest() {
  const { sessions, settings } = useStore();

  const digest = useMemo(() => {
    const since = Date.now() - WINDOW_MS;
    const recent = sessions.filter((s) => new Date(s.startedAt).getTime() >= since);
    if (recent.length === 0) return null;
    const totalSec = recent.reduce((sum, s) => sum + s.durationSec, 0);
    const longestSec = recent.reduce((max, s) => Math.max(max, s.durationSec), 0);
    const newDecorations = settings.celebratedMilestones
      .filter((m) => m.id.startsWith('deco-') && new Date(m.at).getTime() >= since)
      .map((m) => DECORATIONS.find((d) => `deco-${d.id}` === m.id))
      .filter((d): d is (typeof DECORATIONS)[number] => !!d);
    return { totalSec, longestSec, newDecorations, sessionCount: recent.length };
  }, [sessions, settings.celebratedMilestones]);

  if (!digest) return null;

  return (
    <section className="section">
      <h2 className="section-title">直近7日のふりかえり</h2>
      <div className="digest-card">
        <div className="digest-row">
          <span className="digest-value">{formatMinutes(digest.totalSec)}</span>
          <span className="hint">合計（{digest.sessionCount}回の学習）</span>
        </div>
        <div className="digest-row">
          <span className="digest-value">{formatMinutes(digest.longestSec)}</span>
          <span className="hint">最長セッション</span>
        </div>
        {digest.newDecorations.length > 0 && (
          <div className="digest-decos">
            <span className="hint">新しく仲間になった住人</span>
            <div className="digest-deco-list">
              {digest.newDecorations.map((d) => (
                <span key={d.id} className="digest-deco-chip">
                  {d.emoji} {d.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
