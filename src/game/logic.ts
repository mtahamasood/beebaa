export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = readonly Cell[];

export interface GameResult {
  winner: Player | null; // null means draw
  line: readonly [number, number, number] | null; // null means draw
}

export const WINNING_LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function createEmptyBoard(): Board {
  return Array<Cell>(9).fill(null);
}

export function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

export function availableMoves(board: Board): number[] {
  const moves: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) moves.push(i);
  }
  return moves;
}

/**
 * Returns the game result: a winner with its winning line, a draw
 * (winner and line both null), or null while the game is still live.
 */
export function calculateResult(board: Board): GameResult | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const cell = board[a];
    if (cell !== null && cell !== undefined && cell === board[b] && cell === board[c]) {
      return { winner: cell, line };
    }
  }
  if (isBoardFull(board)) {
    return { winner: null, line: null };
  }
  return null;
}

function opponent(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}

/**
 * Depth-adjusted minimax score from the perspective of `me`.
 * Faster wins score higher; slower losses score higher (less bad),
 * so the computer closes out won positions instead of stalling.
 */
function minimax(board: Cell[], turn: Player, me: Player, depth: number): number {
  const result = calculateResult(board);
  if (result !== null) {
    if (result.winner === null) return 0;
    return result.winner === me ? 10 - depth : depth - 10;
  }

  const maximizing = turn === me;
  let best = maximizing ? -Infinity : Infinity;
  for (const move of availableMoves(board)) {
    board[move] = turn;
    const score = minimax(board, opponent(turn), me, depth + 1);
    board[move] = null;
    best = maximizing ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
}

/**
 * Returns the optimal move index for `player`, or -1 if the game is
 * already over or the board is full.
 */
export function bestMove(board: Board, player: Player): number {
  if (calculateResult(board) !== null) return -1;

  const working: Cell[] = [...board];
  let bestScore = -Infinity;
  let choice = -1;
  for (const move of availableMoves(working)) {
    working[move] = player;
    const score = minimax(working, opponent(player), player, 1);
    working[move] = null;
    if (score > bestScore) {
      bestScore = score;
      choice = move;
    }
  }
  return choice;
}
