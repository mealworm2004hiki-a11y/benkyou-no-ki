import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { loadCategories, loadSessions, loadSettings, saveCategories, saveSessions, saveSettings } from './db';
import { Category, IntentPlan, NextNote, Session, Settings } from './types';
import { dateKey, startOfWeek, addDays } from './utils/date';
import { calcStreak } from './utils/streak';
import { achievedMilestones, Milestone } from './utils/milestones';
import { DECORATIONS, isUnlocked } from './utils/decorations';
import { ImportedSession } from './utils/csv';

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface QuickStart {
  categoryId: string;
  autostart: boolean;
}

interface StoreValue {
  categories: Category[];
  sessions: Session[];
  settings: Settings;

  addCategory: (name: string) => void;
  renameCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;

  addSession: (input: { categoryId: string; startedAt: string; durationSec: number; mode: 'simple' | 'pomodoro'; focusResult?: Session['focusResult'] }) => void;
  updateSession: (id: string, patch: Partial<Omit<Session, 'id'>>) => void;
  deleteSession: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  importSessions: (imported: ImportedSession[]) => void;
  setNextNote: (note: NextNote | null) => void;
  setIntentPlan: (plan: IntentPlan | null) => void;

  dailyTotals: Map<string, number>;
  totalSeconds: number;
  totalsByCategory: Map<string, number>;
  lastSessionAtByCategory: Map<string, string>;
  streak: number;
  thisWeekTotal: number;
  lastWeekTotal: number;

  pendingCelebrations: Milestone[];
  dismissCelebration: () => void;

  quickStart: QuickStart | null;
  requestQuickStart: (categoryId: string, autostart?: boolean) => void;
  clearQuickStart: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(() => loadCategories());
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [pendingCelebrations, setPendingCelebrations] = useState<Milestone[]>([]);
  const [quickStart, setQuickStart] = useState<QuickStart | null>(null);

  function persistCategories(next: Category[]) {
    setCategories(next);
    saveCategories(next);
  }
  function persistSessions(next: Session[]) {
    setSessions(next);
    saveSessions(next);
  }
  function persistSettings(next: Settings) {
    setSettings(next);
    saveSettings(next);
  }

  function addCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    persistCategories([...categories, { id: uid(), name: trimmed, color: pickColor(categories.length), order: categories.length }]);
  }

  function renameCategory(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    persistCategories(categories.map((c) => (c.id === id ? { ...c, name: trimmed } : c)));
  }

  function deleteCategory(id: string) {
    if (categories.length <= 1) return;
    const inUse = sessions.some((s) => s.categoryId === id);
    if (inUse) return;
    persistCategories(categories.filter((c) => c.id !== id));
  }

  function findOrCreateCategory(name: string, cats: Category[]): { id: string; cats: Category[] } {
    const existing = cats.find((c) => c.name === name);
    if (existing) return { id: existing.id, cats };
    const created: Category = { id: uid(), name, color: pickColor(cats.length), order: cats.length };
    return { id: created.id, cats: [...cats, created] };
  }

  function checkCelebrations(nextSessions: Session[], settingsSnapshot: Settings) {
    const totals = computeDailyTotals(nextSessions);
    const streak = calcStreak(totals, new Date());
    const total = nextSessions.reduce((sum, s) => sum + s.durationSec, 0);
    const totalHours = total / 3600;
    const achieved: Milestone[] = [
      ...achievedMilestones(streak, total),
      ...DECORATIONS.filter((d) => isUnlocked(d, totalHours, streak)).map((d) => ({
        id: `deco-${d.id}`,
        label: `${d.emoji} ${d.name}が島にやってきた！`,
      })),
    ];
    const already = new Set(settingsSnapshot.celebratedMilestones.map((m) => m.id));
    const fresh = achieved.filter((m) => !already.has(m.id));
    if (fresh.length > 0) {
      const now = new Date().toISOString();
      persistSettings({
        ...settingsSnapshot,
        celebratedMilestones: [...settingsSnapshot.celebratedMilestones, ...fresh.map((m) => ({ id: m.id, at: now }))],
      });
      setPendingCelebrations((prev) => [...prev, ...fresh]);
    }
  }

  function addSession(input: { categoryId: string; startedAt: string; durationSec: number; mode: 'simple' | 'pomodoro'; focusResult?: Session['focusResult'] }) {
    if (input.durationSec <= 0) return;
    const next = [...sessions, { id: uid(), ...input }];
    persistSessions(next);
    checkCelebrations(next, settings);
  }

  function updateSession(id: string, patch: Partial<Omit<Session, 'id'>>) {
    const next = sessions.map((s) => (s.id === id ? { ...s, ...patch } : s));
    persistSessions(next);
    checkCelebrations(next, settings);
  }

  function deleteSession(id: string) {
    persistSessions(sessions.filter((s) => s.id !== id));
  }

  function updateSettings(patch: Partial<Settings>) {
    persistSettings({ ...settings, ...patch });
  }

  function setNextNote(note: NextNote | null) {
    persistSettings({ ...settings, nextNote: note });
  }

  function setIntentPlan(plan: IntentPlan | null) {
    persistSettings({ ...settings, intentPlan: plan });
  }

  function importSessions(imported: ImportedSession[]) {
    let cats = categories;
    const newSessions: Session[] = [];
    for (const row of imported) {
      if (!row.startedAt || row.durationSec <= 0) continue;
      const found = findOrCreateCategory(row.categoryName, cats);
      cats = found.cats;
      newSessions.push({ id: uid(), categoryId: found.id, startedAt: row.startedAt, durationSec: row.durationSec, mode: row.mode });
    }
    persistCategories(cats);
    const next = [...sessions, ...newSessions];
    persistSessions(next);
    checkCelebrations(next, settings);
  }

  function dismissCelebration() {
    setPendingCelebrations((prev) => prev.slice(1));
  }

  function requestQuickStart(categoryId: string, autostart = true) {
    setQuickStart({ categoryId, autostart });
  }

  function clearQuickStart() {
    setQuickStart(null);
  }

  const dailyTotals = useMemo(() => computeDailyTotals(sessions), [sessions]);
  const totalSeconds = useMemo(() => sessions.reduce((sum, s) => sum + s.durationSec, 0), [sessions]);
  const totalsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) map.set(s.categoryId, (map.get(s.categoryId) ?? 0) + s.durationSec);
    return map;
  }, [sessions]);
  const lastSessionAtByCategory = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sessions) {
      const cur = map.get(s.categoryId);
      if (!cur || s.startedAt > cur) map.set(s.categoryId, s.startedAt);
    }
    return map;
  }, [sessions]);
  const streak = useMemo(() => calcStreak(dailyTotals, new Date()), [dailyTotals]);
  const thisWeekTotal = useMemo(() => weekTotal(dailyTotals, 0), [dailyTotals]);
  const lastWeekTotal = useMemo(() => weekTotal(dailyTotals, -1), [dailyTotals]);

  const value: StoreValue = {
    categories,
    sessions,
    settings,
    addCategory,
    renameCategory,
    deleteCategory,
    addSession,
    updateSession,
    deleteSession,
    updateSettings,
    importSessions,
    setNextNote,
    setIntentPlan,
    dailyTotals,
    totalSeconds,
    totalsByCategory,
    lastSessionAtByCategory,
    streak,
    thisWeekTotal,
    lastWeekTotal,
    pendingCelebrations,
    dismissCelebration,
    quickStart,
    requestQuickStart,
    clearQuickStart,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

function computeDailyTotals(sessions: Session[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const key = dateKey(new Date(s.startedAt));
    map.set(key, (map.get(key) ?? 0) + s.durationSec);
  }
  return map;
}

function weekTotal(dailyTotals: Map<string, number>, weekOffset: number): number {
  const base = addDays(startOfWeek(new Date()), weekOffset * 7);
  let total = 0;
  for (let i = 0; i < 7; i++) {
    total += dailyTotals.get(dateKey(addDays(base, i))) ?? 0;
  }
  return total;
}

const PALETTE = ['#5b9a5f', '#e0a458', '#4a90a4', '#c96a6a', '#8a6bb1', '#5f9a8a', '#b1966b', '#6b7fb1'];
function pickColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}
