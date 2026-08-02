import { useMemo } from 'react';
import { useStore } from '../../store';
import { villagerLine } from '../../game/villagerLines';

/** 村を開いたときに出る、村人のひとりごと。1日単位でしか変わらない。 */
export function VillagerChat() {
  const { streak, categories, lastSessionAtByCategory } = useStore();

  const line = useMemo(() => {
    let recentCategory: string | null = null;
    let recentAt = '';
    for (const c of categories) {
      const at = lastSessionAtByCategory.get(c.id);
      if (at && at > recentAt) {
        recentAt = at;
        recentCategory = c.name;
      }
    }
    return villagerLine(new Date(), streak, recentCategory);
  }, [streak, categories, lastSessionAtByCategory]);

  return (
    <div className="villager-chat">
      <span className="villager-chat-icon" aria-hidden="true">
        🧑‍🌾
      </span>
      <p className="villager-chat-bubble">{line}</p>
    </div>
  );
}
