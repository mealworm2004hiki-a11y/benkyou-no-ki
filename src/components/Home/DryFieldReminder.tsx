import { useMemo } from 'react';
import { useStore } from '../../store';
import { daysBetween } from '../../utils/date';

const DRY_THRESHOLD_DAYS = 3;

export function DryFieldReminder({ onGoToTimer }: { onGoToTimer: () => void }) {
  const { categories, lastSessionAtByCategory, requestQuickStart } = useStore();

  const driest = useMemo(() => {
    const today = new Date();
    let worst: { categoryId: string; days: number } | null = null;
    for (const c of categories) {
      const lastAt = lastSessionAtByCategory.get(c.id);
      if (!lastAt) continue; // 一度も記録がない科目は「渇いた」対象にしない
      const days = daysBetween(new Date(lastAt), today);
      if (days >= DRY_THRESHOLD_DAYS && (!worst || days > worst.days)) {
        worst = { categoryId: c.id, days };
      }
    }
    return worst;
  }, [categories, lastSessionAtByCategory]);

  if (!driest) return null;
  const categoryName = categories.find((c) => c.id === driest.categoryId)?.name ?? '勉強';

  return (
    <div className="banner-card dry-banner">
      <div className="banner-icon">🌾</div>
      <div className="banner-body">
        <p className="banner-title">{categoryName}の畑がかわいています</p>
        <p className="hint">{driest.days}日ぶり。水をあげに行きましょう</p>
      </div>
      <div className="banner-actions">
        <button
          className="primary-btn"
          onClick={() => {
            requestQuickStart(driest.categoryId, true);
            onGoToTimer();
          }}
        >
          水をあげる
        </button>
      </div>
    </div>
  );
}
