import { useState } from 'react';
import { useGame } from '../../game/store';

export function RewardManager() {
  const { game, addReward, updateReward, archiveReward } = useGame();
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingCost, setEditingCost] = useState('');

  const active = game.rewards.filter((r) => !r.archived);

  function submitNew(e: React.FormEvent) {
    e.preventDefault();
    const cost = Math.round(Number(newCost));
    if (!newName.trim() || !Number.isFinite(cost) || cost <= 0) return;
    addReward(newName.trim(), cost);
    setNewName('');
    setNewCost('');
  }

  function startEdit(id: string, name: string, cost: number) {
    setEditingId(id);
    setEditingName(name);
    setEditingCost(String(cost));
  }

  function submitEdit(id: string) {
    const cost = Math.round(Number(editingCost));
    if (!editingName.trim() || !Number.isFinite(cost) || cost <= 0) {
      setEditingId(null);
      return;
    }
    updateReward(id, { name: editingName.trim(), cost });
    setEditingId(null);
  }

  return (
    <div className="reward-manager">
      <ul className="reward-list">
        {active.map((r) => (
          <li key={r.id} className="reward-item">
            {editingId === r.id ? (
              <>
                <input
                  className="reward-edit-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => submitEdit(r.id)}
                  onKeyDown={(e) => e.key === 'Enter' && submitEdit(r.id)}
                  autoFocus
                />
                <input
                  className="reward-edit-cost"
                  type="number"
                  value={editingCost}
                  onChange={(e) => setEditingCost(e.target.value)}
                  onBlur={() => submitEdit(r.id)}
                  onKeyDown={(e) => e.key === 'Enter' && submitEdit(r.id)}
                />
              </>
            ) : (
              <span className="reward-name" onClick={() => startEdit(r.id, r.name, r.cost)}>
                {r.name} — 🪙{r.cost.toLocaleString()}
              </span>
            )}
            <button className="text-btn danger" onClick={() => archiveReward(r.id)}>
              削除
            </button>
          </li>
        ))}
        {active.length === 0 && <p className="empty-state">まだご褒美がありません</p>}
      </ul>
      <form className="reward-add-form" onSubmit={submitNew}>
        <input placeholder="ご褒美の名前" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <input placeholder="コイン" type="number" value={newCost} onChange={(e) => setNewCost(e.target.value)} />
        <button type="submit" className="secondary-btn">
          追加
        </button>
      </form>
    </div>
  );
}
