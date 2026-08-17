import { useCallback, useEffect, useState } from 'react';

export interface Scores {
  x: number;
  o: number;
  draws: number;
}

const STORAGE_KEY = 'beebaa.tic-tac-toe.scores';

const DEFAULT_SCORES: Scores = { x: 0, o: 0, draws: 0 };

function isValidScores(value: unknown): value is Scores {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (['x', 'o', 'draws'] as const).every(
    (key) =>
      typeof record[key] === 'number' &&
      Number.isSafeInteger(record[key]) &&
      (record[key] as number) >= 0,
  );
}

// Pure read: state initializers must not write (StrictMode invokes them
// twice). Malformed or unavailable storage falls back to defaults; the
// persistence effect below heals the stored value on mount.
function loadScores(): Scores {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_SCORES;
    const parsed: unknown = JSON.parse(raw);
    if (isValidScores(parsed)) {
      return { x: parsed.x, o: parsed.o, draws: parsed.draws };
    }
    return DEFAULT_SCORES;
  } catch {
    return DEFAULT_SCORES;
  }
}

function saveScores(scores: Scores): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // Storage unavailable (private mode, disabled): keep playing in memory.
  }
}

export interface UseScores {
  scores: Scores;
  recordWinner: (winner: 'X' | 'O' | null) => void;
  resetScores: () => void;
}

export function useScores(): UseScores {
  const [scores, setScores] = useState<Scores>(loadScores);

  // Persistence lives here, not inside state updaters (which StrictMode
  // double-invokes). The mount run also overwrites any malformed stored
  // value with the loaded fallback.
  useEffect(() => {
    saveScores(scores);
  }, [scores]);

  const recordWinner = useCallback((winner: 'X' | 'O' | null) => {
    setScores((prev) => ({
      x: prev.x + (winner === 'X' ? 1 : 0),
      o: prev.o + (winner === 'O' ? 1 : 0),
      draws: prev.draws + (winner === null ? 1 : 0),
    }));
  }, []);

  const resetScores = useCallback(() => {
    setScores(DEFAULT_SCORES);
  }, []);

  return { scores, recordWinner, resetScores };
}
