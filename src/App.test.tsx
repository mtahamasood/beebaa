// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

function getSquares(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll<HTMLButtonElement>('.square'));
}

function squareAt(
  squares: HTMLButtonElement[],
  index: number,
): HTMLButtonElement {
  const sq = squares[index];
  if (sq === undefined) throw new Error(`missing square ${index}`);
  return sq;
}

function getScoreValues(container: HTMLElement): number[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>('.scoreboard__item dd'),
    (dd) => Number(dd.textContent),
  );
}

// X: 0, 1, 2 across the top; O: 3, 4.
const X_WIN_MOVES = [0, 3, 1, 4, 2];
// Fills the board with no three aligned (verified in logic.test.ts).
const DRAW_MOVES = [0, 1, 2, 4, 3, 5, 7, 6, 8];

describe('App (rendered under StrictMode, as in production main.tsx)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  // Without vitest globals, Testing Library's auto-cleanup never registers;
  // stale trees would leak across tests and break screen queries.
  afterEach(cleanup);

  it('shows mode selector, empty board, turn indicator, scoreboard, restart', () => {
    const { container } = render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    expect(screen.getByText('Game mode')).toBeTruthy();
    expect(getSquares(container)).toHaveLength(9);
    expect(getSquares(container).every((sq) => sq.textContent === '')).toBe(
      true,
    );
    expect(screen.getByText("X's turn")).toBeTruthy();
    expect(screen.getByLabelText('Scoreboard')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Restart' })).toBeTruthy();
  });

  it('win: names the winner, highlights exactly the winning line, scores +1 exactly once', () => {
    const { container } = render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    const squares = getSquares(container);
    for (const move of X_WIN_MOVES) {
      fireEvent.click(squareAt(squares, move));
    }

    expect(screen.getByText('X wins!')).toBeTruthy();
    const winning = squares.filter((sq) =>
      sq.classList.contains('square--winning'),
    );
    expect(winning).toEqual([squares[0], squares[1], squares[2]]);
    // The winning state reaches accessible names, not only the color change.
    expect(screen.getByLabelText('top left, X, winning')).toBe(squares[0]);
    // Exactly 1 despite StrictMode double-invoking effects.
    expect(getScoreValues(container)).toEqual([1, 0, 0]);
  });

  it('vs computer: announces thinking, locks the board, and renders the reply', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
      fireEvent.click(screen.getByLabelText('Vs computer'));
      fireEvent.click(squareAt(getSquares(container), 0));

      expect(screen.getByText('Computer is thinking…')).toBeTruthy();
      // Clicks are ignored while the reply is pending.
      fireEvent.click(squareAt(getSquares(container), 1));
      expect(squareAt(getSquares(container), 1).textContent).toBe('');

      act(() => {
        vi.advanceTimersByTime(400);
      });
      // Optimal reply to a corner opening is the center.
      expect(squareAt(getSquares(container), 4).textContent).toBe('O');
      expect(screen.getByText("X's turn")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('draw: reports it and increments the draw count exactly once', () => {
    const { container } = render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    const squares = getSquares(container);
    for (const move of DRAW_MOVES) {
      fireEvent.click(squareAt(squares, move));
    }
    expect(screen.getByText("It's a draw.")).toBeTruthy();
    expect(getScoreValues(container)).toEqual([0, 0, 1]);
  });

  it('restart clears the board but preserves scores', () => {
    const { container } = render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    const squares = getSquares(container);
    for (const move of X_WIN_MOVES) {
      fireEvent.click(squareAt(squares, move));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));

    expect(getSquares(container).every((sq) => sq.textContent === '')).toBe(
      true,
    );
    expect(screen.getByText("X's turn")).toBeTruthy();
    expect(getScoreValues(container)).toEqual([1, 0, 0]);

    // A second full game in the SAME mount must score again — the
    // exactly-once guard is per game, not per mount.
    for (const move of X_WIN_MOVES) {
      fireEvent.click(squareAt(getSquares(container), move));
    }
    expect(screen.getByText('X wins!')).toBeTruthy();
    expect(getScoreValues(container)).toEqual([2, 0, 0]);
  });

  it('scores survive a remount (reload equivalent) and reset zeroes them persistently', () => {
    const first = render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    for (const move of X_WIN_MOVES) {
      fireEvent.click(squareAt(getSquares(first.container), move));
    }
    first.unmount();

    // "Reload": a fresh mount reads scores back from localStorage.
    const second = render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    expect(getScoreValues(second.container)).toEqual([1, 0, 0]);

    fireEvent.click(screen.getByRole('button', { name: 'Reset scores' }));
    expect(getScoreValues(second.container)).toEqual([0, 0, 0]);
    second.unmount();

    const third = render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    expect(getScoreValues(third.container)).toEqual([0, 0, 0]);
  });

  it('switching mode mid-game clears the board and keeps scores', () => {
    const { container } = render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    const squares = getSquares(container);
    for (const move of X_WIN_MOVES) {
      fireEvent.click(squareAt(squares, move));
    }
    fireEvent.click(screen.getByLabelText('Vs computer'));

    expect(getSquares(container).every((sq) => sq.textContent === '')).toBe(
      true,
    );
    expect(getScoreValues(container)).toEqual([1, 0, 0]);
  });

  it('every square is a labeled button (keyboard reachable and operable)', () => {
    const { container } = render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    const squares = getSquares(container);
    expect(squares.every((sq) => sq.tagName === 'BUTTON')).toBe(true);
    expect(screen.getByLabelText('top left, empty')).toBe(squares[0]);
    expect(screen.getByLabelText('bottom right, empty')).toBe(squares[8]);
    // Labels track board state so screen readers hear occupied squares.
    fireEvent.click(squareAt(squares, 0));
    expect(screen.getByLabelText('top left, X')).toBe(squares[0]);
    // Status region announces politely for screen readers.
    expect(container.querySelector('[aria-live="polite"]')).toBeTruthy();
  });
});
