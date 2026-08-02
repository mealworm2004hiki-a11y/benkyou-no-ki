import { useState } from 'react';
import { useStore } from '../../store';

export function CategoryManager() {
  const { categories, sessions, addCategory, renameCategory, deleteCategory } = useStore();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const usedIds = new Set(sessions.map((s) => s.categoryId));

  function submitNew(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    addCategory(newName);
    setNewName('');
  }

  function submitEdit(id: string) {
    if (!editingName.trim()) return;
    renameCategory(id, editingName);
    setEditingId(null);
  }

  return (
    <div className="category-manager">
      <ul className="category-list">
        {categories.map((c) => (
          <li key={c.id} className="category-item">
            <span className="category-swatch" style={{ background: c.color }} />
            {editingId === c.id ? (
              <input
                className="category-edit-input"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => submitEdit(c.id)}
                onKeyDown={(e) => e.key === 'Enter' && submitEdit(c.id)}
                autoFocus
              />
            ) : (
              <span className="category-name" onClick={() => { setEditingId(c.id); setEditingName(c.name); }}>
                {c.name}
              </span>
            )}
            <button
              className="text-btn danger"
              disabled={categories.length <= 1 || usedIds.has(c.id)}
              title={usedIds.has(c.id) ? '記録があるため削除できません' : ''}
              onClick={() => deleteCategory(c.id)}
            >
              削除
            </button>
          </li>
        ))}
      </ul>
      <form className="category-add-form" onSubmit={submitNew}>
        <input placeholder="新しい科目名" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button type="submit" className="secondary-btn">
          追加
        </button>
      </form>
    </div>
  );
}
