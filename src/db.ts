import { Category, DEFAULT_CATEGORIES, DEFAULT_SETTINGS, Session, Settings } from './types';

const KEYS = {
  categories: 'bnk_categories',
  sessions: 'bnk_sessions',
  settings: 'bnk_settings',
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function loadArray<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function loadCategories(): Category[] {
  return loadArray(KEYS.categories, DEFAULT_CATEGORIES);
}

export function saveCategories(categories: Category[]) {
  localStorage.setItem(KEYS.categories, JSON.stringify(categories));
}

export function loadSessions(): Session[] {
  return loadArray(KEYS.sessions, []);
}

export function saveSessions(sessions: Session[]) {
  localStorage.setItem(KEYS.sessions, JSON.stringify(sessions));
}

export function loadSettings(): Settings {
  const settings = load(KEYS.settings, DEFAULT_SETTINGS);
  // 旧形式(celebratedMilestones: string[])からの移行
  settings.celebratedMilestones = (settings.celebratedMilestones as unknown[]).map((m) =>
    typeof m === 'string' ? { id: m, at: new Date(0).toISOString() } : (m as Settings['celebratedMilestones'][number])
  );
  return settings;
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}
