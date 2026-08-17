import type { Mode } from '../hooks/useGame';

interface ModeSelectorProps {
  mode: Mode;
  onChangeMode: (mode: Mode) => void;
}

const MODES: readonly { value: Mode; label: string }[] = [
  { value: 'two-player', label: 'Two players' },
  { value: 'vs-computer', label: 'Vs computer' },
];

export function ModeSelector({ mode, onChangeMode }: ModeSelectorProps) {
  return (
    <fieldset className="mode-selector">
      <legend>Game mode</legend>
      {MODES.map(({ value, label }) => (
        <label key={value} className="mode-selector__option">
          <input
            type="radio"
            name="mode"
            value={value}
            checked={mode === value}
            onChange={() => onChangeMode(value)}
          />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
