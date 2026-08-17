---
title: 'Tic-Tac-Toe Web App (React + Vite + TypeScript)'
type: 'feature'
created: '2026-08-17'
status: 'ready-for-dev'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `beebaa` is an empty repository — no app, no tooling, nothing to play.

**Approach:** Scaffold a React + Vite + TypeScript SPA whose rules live in a pure framework-free module, with a mode selector for two-player hot-seat or vs-computer (unbeatable minimax), and a `localStorage` scoreboard.

## Boundaries & Constraints

**Always:**
- Rules and AI live in `src/game/logic.ts` as pure functions — no React, DOM, or storage imports, so they unit-test without a renderer.
- TypeScript `strict: true`; no `any`, no non-null assertions used to silence errors.
- Squares are real `<button>`s with positional `aria-label`s; status sits in an `aria-live="polite"` region.
- Usable from 320px wide up to desktop.
- Runtime dependencies: `react` and `react-dom` only; everything else is a devDependency.

**Ask First:** any runtime dependency beyond react/react-dom; changing the stack; any backend, network call, or persistence beyond `localStorage`.

**Never:** online multiplayer, accounts, or a server; CSS frameworks or component libraries; a router; the computer moving during two-player mode or after the game ends; AI difficulty levels — it plays optimally, always.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Place mark | Empty square, game live | Mark appears, turn flips | N/A |
| Illegal click | Occupied square, or any square after win/draw | Ignored; board and turn unchanged | N/A |
| Win | Three aligned (row/column/diagonal) | Status names the winner; those 3 squares highlight; that score +1 exactly | N/A |
| Draw | 9 filled, none aligned | Status reads draw; draw count +1 exactly | N/A |
| Computer replies | Vs-computer, human moved, game live | Optimal move after ~300–500ms; board locked during the delay | N/A |
| Unbeatable | Any legal human play vs computer | Every game ends in a computer win or a draw | N/A |
| Bad stored scores | Malformed JSON or wrong-shaped object at the scores key | Falls back to 0/0/0; app renders normally | Catch, overwrite with defaults, never throw to the UI |
| Storage throws | `localStorage` unavailable (private mode, disabled) | Fully playable; scores held in memory for the session | Catch and ignore; no crash |
| Restart | Restart pressed | Board clears, X moves first; scores preserved | N/A |
| Change mode | Different mode selected mid-game | Board clears, new mode active; scores preserved | N/A |
| Reset scores | Reset pressed | Counters return to 0 and persist | N/A |

</frozen-after-approval>

## Code Map

Greenfield — every file is new; nothing existing to reuse or preserve.

- `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `.gitignore` -- toolchain: scripts `dev`/`build`/`preview`/`test`/`typecheck`; react+react-dom runtime; vite, @vitejs/plugin-react, typescript, vitest dev; strict TS; Vitest `environment: 'node'` (logic needs no DOM)
- `src/main.tsx` -- React root in `<StrictMode>`
- `src/game/logic.ts` -- `Player`/`Cell`/`Board`, `WINNING_LINES`, `calculateResult`, `isBoardFull`, `availableMoves`, `bestMove` (minimax)
- `src/game/logic.test.ts` -- unit tests for the pure matrix rows
- `src/hooks/useGame.ts` -- board/turn/mode/result; schedules the computer's reply
- `src/hooks/useScores.ts` -- `{x, o, draws}` ↔ `localStorage`, defensively
- `src/components/` -- `Square.tsx`, `Board.tsx` (3×3 grid), `ModeSelector.tsx`, `Scoreboard.tsx`
- `src/App.tsx` -- composition, status text, score trigger
- `src/styles.css` -- responsive grid, winning highlight, focus rings

## Tasks & Acceptance

**Execution:**
- [ ] toolchain files (see Code Map) -- scaffold -- one coherent setup; unbuildable if split
- [ ] `src/game/logic.ts` -- types, result detection returning the winning line, minimax `bestMove` -- pure core everything depends on
- [ ] `src/game/logic.test.ts` -- wins in every row/column/diagonal, draw, occupied-square rejection, and `bestMove` taking an immediate win and blocking an immediate loss -- proves the unbeatable claim
- [ ] `src/hooks/useScores.ts` -- persist counters; guard parse failure, wrong shape, throwing storage
- [ ] `src/hooks/useGame.ts` -- board/turn/mode/result; reject illegal clicks; schedule and lock input during the computer's reply -- legality in one place
- [ ] `src/components/Square.tsx`, `Board.tsx` -- accessible buttons, grid, winning-square marking
- [ ] `src/components/ModeSelector.tsx`, `Scoreboard.tsx` -- mode switching; score display and reset
- [ ] `src/App.tsx` -- compose tree, `aria-live` status, increment scores exactly once per game
- [ ] `src/styles.css` -- 320px-up layout, winning highlight, visible focus

**Acceptance Criteria:**
- Given a fresh clone, when `npm install && npm run build` runs, then it completes with no TypeScript or build errors.
- Given the dev server is up, when the app opens, then mode selector, empty board, turn indicator, scoreboard, and restart are all visible.
- Given a completed game, when the score increments, then it rises by exactly 1 despite StrictMode double-invoking effects in dev.
- Given a browser reload, when the app remounts, then accumulated scores still display.
- Given keyboard only, when tabbing through, then every square and control is reachable and operable with a visible focus ring.

## Spec Change Log

## Design Notes

**Score increments must not sit in a bare `useEffect`** — StrictMode double-invokes effects in dev and would double-count. Fire on the transition to a resolved result, guarded against re-entry:

```ts
const scoredRef = useRef<number | null>(null);
useEffect(() => {
  if (!result || scoredRef.current === gameId) return;
  scoredRef.current = gameId;
  recordResult(result);
}, [result, gameId, recordResult]);
```

**Minimax** should be depth-adjusted to prefer faster wins and slower losses, so the computer closes out won positions instead of stalling. A 9-cell search is trivially fast — no pruning or memoization needed. The reply delay is for readability, not thinking time.

## Verification

**Commands:**
- `npm install` -- completes, `node_modules/` present
- `npm run typecheck` (`tsc --noEmit`) -- zero errors under `strict`
- `npm run test` (`vitest run`) -- all logic tests pass, AI assertions included
- `npm run build` -- `dist/` produced, no errors
- `npm run dev` -- serves cleanly for manual checks

**Manual checks:**
- Two-player game to a win: line highlights, score +1.
- Several games vs computer while trying to win: all end in a loss or draw.
- Reload: scores persist. Reset: counters zero, and stay zero after reload.
- 320px viewport: board stays square, readable, usable.
