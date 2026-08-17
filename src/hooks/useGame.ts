import { useCallback, useEffect, useState } from 'react';
import {
  bestMove,
  calculateResult,
  createEmptyBoard,
  type Board,
  type GameResult,
  type Player,
} from '../game/logic';

export type Mode = 'two-player' | 'vs-computer';

const COMPUTER: Player = 'O';

const COMPUTER_DELAY_MS = 400;

export interface UseGame {
  board: Board;
  currentPlayer: Player;
  mode: Mode;
  result: GameResult | null;
  /** Increments every new game; used to fire per-game effects exactly once. */
  gameId: number;
  /** True while the computer's reply is scheduled; input is locked. */
  isComputerThinking: boolean;
  playSquare: (index: number) => void;
  restart: () => void;
  changeMode: (mode: Mode) => void;
}

export function useGame(): UseGame {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [mode, setMode] = useState<Mode>('two-player');
  const [gameId, setGameId] = useState(0);

  const result = calculateResult(board);

  const isComputerThinking =
    mode === 'vs-computer' && result === null && currentPlayer === COMPUTER;

  const playSquare = useCallback(
    (index: number) => {
      // Legality lives here: reject occupied squares, finished games,
      // and any click while the computer's reply is pending.
      if (isComputerThinking || result !== null || board[index] !== null) {
        return;
      }
      const next = [...board];
      next[index] = currentPlayer;
      setBoard(next);
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    },
    [board, currentPlayer, isComputerThinking, result],
  );

  // Schedule the computer's reply after a short readability delay.
  useEffect(() => {
    if (!isComputerThinking) return;
    const timer = setTimeout(() => {
      const move = bestMove(board, COMPUTER);
      if (move === -1) return;
      const next = [...board];
      next[move] = COMPUTER;
      setBoard(next);
      setCurrentPlayer('X');
    }, COMPUTER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isComputerThinking, board]);

  const startNewGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPlayer('X');
    setGameId((id) => id + 1);
  }, []);

  const changeMode = useCallback(
    (nextMode: Mode) => {
      setMode(nextMode);
      startNewGame();
    },
    [startNewGame],
  );

  return {
    board,
    currentPlayer,
    mode,
    result,
    gameId,
    isComputerThinking,
    playSquare,
    restart: startNewGame,
    changeMode,
  };
}
