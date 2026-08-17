import type { Cell } from '../game/logic';

interface SquareProps {
  value: Cell;
  index: number;
  isWinning: boolean;
  onClick: () => void;
}

const ROW_NAMES = ['top', 'middle', 'bottom'] as const;
const COLUMN_NAMES = ['left', 'center', 'right'] as const;

export function Square({ value, index, isWinning, onClick }: SquareProps) {
  const row = ROW_NAMES[Math.floor(index / 3)] ?? 'unknown';
  const column = COLUMN_NAMES[index % 3] ?? 'unknown';
  const position = `${row} ${column}`;
  const contents = value === null ? 'empty' : value;
  // Winning state must reach screen readers too, not just the color change.
  const label = `${position}, ${contents}${isWinning ? ', winning' : ''}`;

  // Illegal clicks (occupied square, finished game, computer thinking) are
  // rejected in useGame; the button stays enabled so it remains keyboard
  // focusable per the accessibility acceptance criteria.
  return (
    <button
      type="button"
      className={`square${isWinning ? ' square--winning' : ''}`}
      aria-label={label}
      onClick={onClick}
    >
      {value}
    </button>
  );
}
