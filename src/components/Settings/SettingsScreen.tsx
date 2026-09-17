import { CategoryManager } from './CategoryManager';
import { WeeklyGoalsEditor } from './WeeklyGoalsEditor';
import { CsvBackup } from './CsvBackup';
import { SoundSettings } from './SoundSettings';
import { TextbookManager } from './TextbookManager';
import { EnglishHabitSettings } from './EnglishHabitSettings';

export function SettingsScreen() {
  return (
    <div className="screen settings-screen">
      <h1 className="screen-title">設定</h1>

      <section className="section">
        <h2 className="section-title">数検ペーサー（教材）</h2>
        <TextbookManager />
      </section>

      <section className="section">
        <h2 className="section-title">英語の毎日習慣</h2>
        <EnglishHabitSettings />
      </section>

      <section className="section">
        <h2 className="section-title">科目</h2>
        <CategoryManager />
      </section>

      <section className="section">
        <h2 className="section-title">曜日ごとの目標時間</h2>
        <WeeklyGoalsEditor />
      </section>

      <section className="section">
        <h2 className="section-title">音・振動</h2>
        <SoundSettings />
      </section>

      <section className="section">
        <h2 className="section-title">バックアップ</h2>
        <CsvBackup />
      </section>
    </div>
  );
}
