import { describe, expect, it } from 'vitest';
import {
  availableMoves,
  bestMove,
  calculateResult,
  createEmptyBoard,
  isBoardFull,
  WINNING_LINES,
  type Board,
  type Cell,
  type Player,
} from './logic';

function boardWith(entries: Record<number, Player>): Board {
  const board: Cell[] = Array<Cell>(9).fill(null);
  for (const [index, player] of Object.entries(entries)) {
    board[Number(index)] = player;
  }
  return board;
}

describe('calculateResult', () => {
  it('returns null for an empty board (game live)', () => {
    expect(calculateResult(createEmptyBoard())).toBeNull();
  });

  it.each(WINNING_LINES.map((line) => [line] as const))(
    'detects a win with its line for %j',
    (line) => {
      const [a, b, c] = line;
      const board = boardWith({ [a]: 'X', [b]: 'X', [c]: 'X' });
      const result = calculateResult(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('X');
      expect(result?.line).toEqual(line);
    },
  );

  it('detects an O win too', () => {
    const board = boardWith({ 0: 'O', 3: 'O', 6: 'O', 1: 'X', 2: 'X', 4: 'X' });
    // Careful: 1,2 plus 4 for X does not form a line.
    const result = calculateResult(board);
    expect(result?.winner).toBe('O');
    expect(result?.line).toEqual([0, 3, 6]);
  });

  it('detects a draw when all 9 squares fill with no line', () => {
    // X O X / X O O / O X X — no three aligned
    const board: Board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    const result = calculateResult(board);
    expect(result).not.toBeNull();
    expect(result?.winner).toBeNull();
    expect(result?.line).toBeNull();
  });

  it('returns null mid-game with no winner', () => {
    const board = boardWith({ 0: 'X', 4: 'O' });
    expect(calculateResult(board)).toBeNull();
  });
});

describe('board helpers', () => {
  it('isBoardFull is false with any empty square and true when full', () => {
    expect(isBoardFull(createEmptyBoard())).toBe(false);
    const full: Board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    expect(isBoardFull(full)).toBe(true);
  });

  it('availableMoves lists exactly the empty squares (occupied squares rejected)', () => {
    const board = boardWith({ 0: 'X', 4: 'O', 8: 'X' });
    expect(availableMoves(board)).toEqual([1, 2, 3, 5, 6, 7]);
    expect(availableMoves(board)).not.toContain(0);
    expect(availableMoves(board)).not.toContain(4);
    expect(availableMoves(board)).not.toContain(8);
  });
});

describe('bestMove (minimax)', () => {
  it('takes an immediate win', () => {
    // O can win at 2 (0,1,2); ignore X's threats — winning outranks blocking.
    const board = boardWith({ 0: 'O', 1: 'O', 3: 'X', 4: 'X' });
    expect(bestMove(board, 'O')).toBe(2);
  });

  it('blocks an immediate loss', () => {
    // X threatens 0,1,2 at square 2; O has no win, must block.
    const board = boardWith({ 0: 'X', 1: 'X', 4: 'O' });
    expect(bestMove(board, 'O')).toBe(2);
  });

  it('returns -1 when the game is already over', () => {
    const board = boardWith({ 0: 'X', 1: 'X', 2: 'X', 3: 'O', 4: 'O' });
    expect(bestMove(board, 'O')).toBe(-1);
  });

  it('never loses: exhaustive search over every legal human game vs the computer', () => {
    // Human plays every possible move at each turn; computer replies with
    // bestMove. Assert no reachable terminal state is a human win.
    const play = (board: Cell[], turn: Player, computer: Player): void => {
      const result = calculateResult(board);
      if (result !== null) {
        expect(result.winner).not.toBe(computer === 'X' ? 'O' : 'X');
        return;
      }
      if (turn === computer) {
        const move = bestMove(board, computer);
        board[move] = computer;
        play(board, computer === 'X' ? 'O' : 'X', computer);
        board[move] = null;
      } else {
        for (const move of availableMoves(board)) {
          board[move] = turn;
          play(board, computer, computer);
          board[move] = null;
        }
      }
    };

    // Computer as O (human X moves first) and computer as X.
    play(Array<Cell>(9).fill(null), 'X', 'O');
    play(Array<Cell>(9).fill(null), 'X', 'X');
  });
});
