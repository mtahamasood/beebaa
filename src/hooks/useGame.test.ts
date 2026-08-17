// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGame } from './useGame';

describe('useGame', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Without vitest globals, Testing Library's auto-cleanup never registers;
    // leaked hook mounts would keep live timers across tests.
    cleanup();
    vi.useRealTimers();
  });

  it('places a mark on an empty square and flips the turn', () => {
    const { result } = renderHook(() => useGame());
    act(() => result.current.playSquare(0));
    expect(result.current.board[0]).toBe('X');
    expect(result.current.currentPlayer).toBe('O');
  });

  it('ignores a click on an occupied square', () => {
    const { result } = renderHook(() => useGame());
    act(() => result.current.playSquare(0));
    act(() => result.current.playSquare(0));
    expect(result.current.board[0]).toBe('X');
    expect(result.current.currentPlayer).toBe('O');
  });

  it('ignores clicks after the game is decided, preserving the final board', () => {
    const { result } = renderHook(() => useGame());
    // X: 0, 1, 2 wins; O: 3, 4.
    for (const move of [0, 3, 1, 4, 2]) {
      act(() => result.current.playSquare(move));
    }
    expect(result.current.result?.winner).toBe('X');
    expect(result.current.result?.line).toEqual([0, 1, 2]);

    const finalBoard = [...result.current.board];
    act(() => result.current.playSquare(5));
    expect(result.current.board).toEqual(finalBoard);
  });

  it('restart clears the board, X moves first, and gameId advances', () => {
    const { result } = renderHook(() => useGame());
    act(() => result.current.playSquare(0));
    const previousGameId = result.current.gameId;
    act(() => result.current.restart());
    expect(result.current.board.every((cell) => cell === null)).toBe(true);
    expect(result.current.currentPlayer).toBe('X');
    expect(result.current.gameId).toBe(previousGameId + 1);
  });

  it('changing mode mid-game clears the board and activates the new mode', () => {
    const { result } = renderHook(() => useGame());
    act(() => result.current.playSquare(0));
    act(() => result.current.changeMode('vs-computer'));
    expect(result.current.mode).toBe('vs-computer');
    expect(result.current.board.every((cell) => cell === null)).toBe(true);
    expect(result.current.currentPlayer).toBe('X');
  });

  it('vs computer: replies after the delay and locks the board while pending', () => {
    const { result } = renderHook(() => useGame());
    act(() => result.current.changeMode('vs-computer'));
    act(() => result.current.playSquare(0));

    // Reply is scheduled but has not landed yet.
    expect(result.current.isComputerThinking).toBe(true);
    expect(result.current.board.filter((c) => c !== null)).toHaveLength(1);

    // Input is locked during the delay.
    act(() => result.current.playSquare(1));
    expect(result.current.board[1]).toBeNull();

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current.board.filter((c) => c === 'O')).toHaveLength(1);
    // Optimal reply: only the center holds the draw against a corner opening.
    expect(result.current.board[4]).toBe('O');
    expect(result.current.currentPlayer).toBe('X');
    expect(result.current.isComputerThinking).toBe(false);
  });

  it('two-player mode: the computer never moves', () => {
    const { result } = renderHook(() => useGame());
    act(() => result.current.playSquare(0));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.board.filter((c) => c !== null)).toHaveLength(1);
    expect(result.current.isComputerThinking).toBe(false);
  });

  it('restart cancels a pending computer reply', () => {
    const { result } = renderHook(() => useGame());
    act(() => result.current.changeMode('vs-computer'));
    act(() => result.current.playSquare(0));
    expect(result.current.isComputerThinking).toBe(true);

    // Restart before the delay elapses: the scheduled reply must die with it.
    act(() => result.current.restart());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.board.every((cell) => cell === null)).toBe(true);
    expect(result.current.isComputerThinking).toBe(false);
    expect(result.current.currentPlayer).toBe('X');
  });

  it('switching mode cancels a pending computer reply', () => {
    const { result } = renderHook(() => useGame());
    act(() => result.current.changeMode('vs-computer'));
    act(() => result.current.playSquare(0));
    expect(result.current.isComputerThinking).toBe(true);

    // Leave vs-computer before the delay elapses: no ghost move may land.
    act(() => result.current.changeMode('two-player'));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.board.every((cell) => cell === null)).toBe(true);
    expect(result.current.isComputerThinking).toBe(false);
    expect(result.current.currentPlayer).toBe('X');
  });

  it('vs computer: no reply is scheduled once the game has ended', () => {
    const { result } = renderHook(() => useGame());
    act(() => result.current.changeMode('vs-computer'));
    // Drive to a finished game by alternating human move + computer reply.
    for (let i = 0; i < 5 && result.current.result === null; i += 1) {
      const empty = result.current.board.findIndex((c) => c === null);
      act(() => result.current.playSquare(empty));
      act(() => {
        vi.advanceTimersByTime(400);
      });
    }
    expect(result.current.result).not.toBeNull();

    const finalBoard = [...result.current.board];
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.board).toEqual(finalBoard);
    expect(result.current.isComputerThinking).toBe(false);
  });
});
