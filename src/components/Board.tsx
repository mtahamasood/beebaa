import type { Board as BoardState, GameResult } from '../game/logic';
import { Square } from './Square';

interface BoardProps {
  board: BoardState;
  result: GameResult | null;
  onPlay: (index: number) => void;
}

export function Board({ board, result, onPlay }: BoardProps) {
  const winningLine = result?.line ?? null;

  return (
    <div className="board" role="group" aria-label="Tic-tac-toe board">
      {board.map((cell, index) => (
        <Square
          key={index}
          value={cell}
          index={index}
          isWinning={winningLine !== null && winningLine.includes(index)}
          onClick={() => onPlay(index)}
        />
      ))}
    </div>
  );
}
