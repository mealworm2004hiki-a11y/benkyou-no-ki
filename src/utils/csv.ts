import { Category, Session } from '../types';

const HEADER = 'date,startedAt,durationMin,categoryName,mode';

export function sessionsToCsv(sessions: Session[], categories: Category[]): string {
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  const rows = sessions.map((s) => {
    const date = s.startedAt.slice(0, 10);
    const durationMin = Math.round((s.durationSec / 60) * 100) / 100;
    const categoryName = nameById.get(s.categoryId) ?? '不明';
    return [date, s.startedAt, String(durationMin), csvEscape(categoryName), s.mode].join(',');
  });
  return [HEADER, ...rows].join('\n');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

export interface ImportedSession {
  startedAt: string;
  durationSec: number;
  categoryName: string;
  mode: 'simple' | 'pomodoro';
}

export function csvToSessions(csv: string): ImportedSession[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];
  const [, ...rows] = lines;
  return rows.map((line) => {
    const [, startedAt, durationMin, categoryName, mode] = parseCsvLine(line);
    return {
      startedAt,
      durationSec: Math.round(parseFloat(durationMin) * 60),
      categoryName: categoryName || '不明',
      mode: mode === 'pomodoro' ? 'pomodoro' : 'simple',
    };
  });
}
