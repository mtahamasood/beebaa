<!-- bmad:context -->
<!-- Verified 2026-08-18 against 4b26d499a4d340ab1419789127d655f8b34225b7. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## beebaa

Tic-tac-toe web app: React + Vite + TypeScript SPA with an unbeatable minimax AI and a localStorage scoreboard. Remote: github.com/mtahamasood/beebaa. BMad-managed — specs and deferred work live in `_bmad-output/implementation-artifacts/`.

## Policy

- Never push to `master` — it is protected (required `ci` and `e2e` checks, strict, PRs only, linear history). Branch, PR, merge when green: `gh pr merge --auto --squash`.
- The CI jobs' display names `ci` and `e2e` are the required-status-check contexts in branch protection. Renaming either, or adding a `strategy.matrix`, blocks all merges until the protection rule is updated to match.

## Where things are

- Game rules and AI: `src/game/logic.ts` — pure functions, the core everything depends on.
- To launch, drive, or screenshot the app headlessly, use the `run-beebaa` skill: `.claude/skills/run-beebaa/SKILL.md` (driver, setup, gotchas).

## Running and verifying

- `uv` and `gh` live in `~/.local/bin`, which fresh non-login shells miss — prefix commands with `export PATH="$HOME/.local/bin:$PATH"` when they report command-not-found.
- `sudo` requires a password no agent has; use rootless installs (binaries to `~/.local/bin`, `.deb` extraction — see `.claude/skills/run-beebaa/setup-deps.sh` for the pattern).
- `npm run typecheck` is `tsc -b` (solution-style tsconfig): it checks `src/` AND `vite.config.ts`; plain `tsc --noEmit` misses the latter.

## Conventions that differ from defaults

- `src/game/` stays free of React, DOM, and storage imports so the rules unit-test without a renderer.
- Effects and state updaters must be StrictMode-safe — the app runs under `<StrictMode>`, and per-game side effects are guarded by `gameId` (see `src/App.tsx`).

## Known pitfalls

- Vitest runs without `globals: true`, so Testing Library's auto-cleanup never registers — every test file using `render`/`renderHook` must call `cleanup()` in `afterEach`, or trees leak across tests and `screen` queries find duplicates.

<!-- /bmad:context -->
