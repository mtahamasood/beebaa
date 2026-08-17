// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScores } from './useScores';

const STORAGE_KEY = 'beebaa.tic-tac-toe.scores';

describe('useScores', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    // Without vitest globals, Testing Library's auto-cleanup never registers.
    cleanup();
    vi.restoreAllMocks();
  });

  it('starts at 0/0/0 with empty storage', () => {
    const { result } = renderHook(() => useScores());
    expect(result.current.scores).toEqual({ x: 0, o: 0, draws: 0 });
  });

  it('loads previously stored scores', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ x: 2, o: 1, draws: 3 }),
    );
    const { result } = renderHook(() => useScores());
    expect(result.current.scores).toEqual({ x: 2, o: 1, draws: 3 });
  });

  it('falls back to 0/0/0 on malformed JSON and renders normally', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json!');
    const { result } = renderHook(() => useScores());
    expect(result.current.scores).toEqual({ x: 0, o: 0, draws: 0 });
  });

  it('falls back to 0/0/0 on a wrong-shaped object and overwrites it', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ x: 'two', wins: 5 }),
    );
    const { result } = renderHook(() => useScores());
    expect(result.current.scores).toEqual({ x: 0, o: 0, draws: 0 });
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify({ x: 0, o: 0, draws: 0 }),
    );
  });

  it('falls back to 0/0/0 on fractional counts', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ x: 1.5, o: 0, draws: 0 }),
    );
    const { result } = renderHook(() => useScores());
    expect(result.current.scores).toEqual({ x: 0, o: 0, draws: 0 });
  });

  it('keeps working in memory when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    const { result } = renderHook(() => useScores());
    expect(result.current.scores).toEqual({ x: 0, o: 0, draws: 0 });

    act(() => result.current.recordWinner('X'));
    expect(result.current.scores).toEqual({ x: 1, o: 0, draws: 0 });
  });

  it('records X wins, O wins, and draws, persisting each', () => {
    const { result } = renderHook(() => useScores());
    act(() => result.current.recordWinner('X'));
    act(() => result.current.recordWinner('O'));
    act(() => result.current.recordWinner(null));
    expect(result.current.scores).toEqual({ x: 1, o: 1, draws: 1 });
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '')).toEqual({
      x: 1,
      o: 1,
      draws: 1,
    });
  });

  it('reset returns counters to 0 and persists the cleared state', () => {
    const { result } = renderHook(() => useScores());
    act(() => result.current.recordWinner('X'));
    act(() => result.current.resetScores());
    expect(result.current.scores).toEqual({ x: 0, o: 0, draws: 0 });
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '')).toEqual({
      x: 0,
      o: 0,
      draws: 0,
    });
  });
});
