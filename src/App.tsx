import { useEffect, useRef } from 'react';
import { Board } from './components/Board';
import { ModeSelector } from './components/ModeSelector';
import { Scoreboard } from './components/Scoreboard';
import { useGame } from './hooks/useGame';
import { useScores } from './hooks/useScores';

export function App() {
  const {
    board,
    currentPlayer,
    mode,
    result,
    gameId,
    isComputerThinking,
    playSquare,
    restart,
    changeMode,
  } = useGame();
  const { scores, recordWinner, resetScores } = useScores();

  // Score exactly once per game, even with StrictMode double-invoking
  // effects in dev: guard on the gameId already scored.
  const scoredRef = useRef<number | null>(null);
  useEffect(() => {
    if (result === null || scoredRef.current === gameId) return;
    scoredRef.current = gameId;
    recordWinner(result.winner);
  }, [result, gameId, recordWinner]);

  let status: string;
  if (result !== null) {
    status = result.winner !== null ? `${result.winner} wins!` : "It's a draw.";
  } else if (isComputerThinking) {
    status = 'Computer is thinking…';
  } else {
    status = `${currentPlayer}'s turn`;
  }

  return (
    <main className="app">
      <h1>Tic-Tac-Toe</h1>
      <ModeSelector mode={mode} onChangeMode={changeMode} />
      <p className="status" aria-live="polite">
        {status}
      </p>
      <Board board={board} result={result} onPlay={playSquare} />
      <button type="button" className="button" onClick={restart}>
        Restart
      </button>
      <Scoreboard scores={scores} onReset={resetScores} />
    </main>
  );
}
