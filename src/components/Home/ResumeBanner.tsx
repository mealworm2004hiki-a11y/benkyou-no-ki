import { useStore } from '../../store';

export function ResumeBanner({ onGoToTimer }: { onGoToTimer: () => void }) {
  const { settings, categories, setNextNote, requestQuickStart } = useStore();
  const note = settings.nextNote;
  if (!note) return null;
  const categoryName = categories.find((c) => c.id === note.categoryId)?.name ?? '勉強';

  function resume() {
    requestQuickStart(note!.categoryId, true);
    setNextNote(null);
    onGoToTimer();
  }

  return (
    <div className="banner-card resume-banner">
      <div className="banner-icon">📝</div>
      <div className="banner-body">
        <p className="banner-title">しおり: 「{note.text}」</p>
        <p className="hint">{categoryName}の続きから</p>
      </div>
      <div className="banner-actions">
        <button className="primary-btn" onClick={resume}>
          はじめる
        </button>
        <button className="text-btn" onClick={() => setNextNote(null)}>
          消す
        </button>
      </div>
    </div>
  );
}
