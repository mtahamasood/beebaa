import type { Scores } from '../hooks/useScores';

interface ScoreboardProps {
  scores: Scores;
  onReset: () => void;
}

export function Scoreboard({ scores, onReset }: ScoreboardProps) {
  return (
    <section className="scoreboard" aria-label="Scoreboard">
      <dl className="scoreboard__list">
        <div className="scoreboard__item">
          <dt>X wins</dt>
          <dd>{scores.x}</dd>
        </div>
        <div className="scoreboard__item">
          <dt>O wins</dt>
          <dd>{scores.o}</dd>
        </div>
        <div className="scoreboard__item">
          <dt>Draws</dt>
          <dd>{scores.draws}</dd>
        </div>
      </dl>
      <button type="button" className="button button--subtle" onClick={onReset}>
        Reset scores
      </button>
    </section>
  );
}
