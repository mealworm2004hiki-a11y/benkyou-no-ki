import { useRef, useState } from 'react';
import { useStore } from '../../store';
import { csvToSessions, sessionsToCsv } from '../../utils/csv';

export function CsvBackup() {
  const { sessions, categories, importSessions } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleExport() {
    const csv = sessionsToCsv(sessions, categories);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `benkyou-no-ki-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const imported = csvToSessions(text);
    importSessions(imported);
    setMessage(`${imported.length}件の記録を読み込みました`);
    e.target.value = '';
  }

  return (
    <div className="csv-backup">
      <button className="secondary-btn" onClick={handleExport}>
        CSVをエクスポート
      </button>
      <button className="secondary-btn" onClick={handleImportClick}>
        CSVをインポート
      </button>
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" hidden onChange={handleFileChange} />
      {message && <p className="hint">{message}</p>}
    </div>
  );
}
