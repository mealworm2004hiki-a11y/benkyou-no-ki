import { useStore } from '../../store';
import { formatMinutes } from '../../utils/date';

export function SubjectBarChart() {
  const { categories, totalsByCategory } = useStore();
  const max = Math.max(1, ...categories.map((c) => totalsByCategory.get(c.id) ?? 0));

  return (
    <div className="bar-chart">
      {categories.map((c) => {
        const sec = totalsByCategory.get(c.id) ?? 0;
        const pct = Math.round((sec / max) * 100);
        return (
          <div className="bar-row" key={c.id}>
            <span className="bar-label">{c.name}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%`, background: c.color }} />
            </div>
            <span className="bar-value">{formatMinutes(sec)}</span>
          </div>
        );
      })}
      {categories.every((c) => (totalsByCategory.get(c.id) ?? 0) === 0) && <p className="empty-state">まだ記録がありません</p>}
    </div>
  );
}
