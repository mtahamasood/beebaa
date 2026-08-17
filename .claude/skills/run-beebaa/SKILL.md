---
name: run-beebaa
description: Build, run, and drive the beebaa tic-tac-toe web app. Use when asked to start beebaa, run the dev server, take a screenshot of the game, play/smoke-test the app in a browser, or verify a UI change works.
---

Beebaa is a React + Vite + TypeScript tic-tac-toe SPA (two-player and
vs-computer minimax modes, localStorage scoreboard). An agent drives it
headlessly via `.claude/skills/run-beebaa/driver.mjs` — a Playwright
script that starts the dev server itself if needed, plays both game
modes, asserts on the DOM, and screenshots the results.

All paths are relative to the repo root.

## Prerequisites

Node 22+ and npm (present on this machine: v22.23.2 / 10.9.8). No
system browser needed — Playwright's Chromium is used. `sudo` needs a
password here, so the setup script installs Chromium's missing system
libs rootlessly (see Gotchas).

## Setup

One-time after clone:

```bash
npm install
bash .claude/skills/run-beebaa/setup-deps.sh
```

The script installs Playwright's Chromium, then makes its shared-library
deps resolve: system-wide via `playwright install-deps` if passwordless
sudo works, otherwise by extracting `libnspr4`, `libnss3`, and
`libasound2t64` .debs into `~/.cache/beebaa-chromium-libs/` (no root).
It ends with `OK: all chromium libs resolve`.

## Run (agent path)

```bash
node .claude/skills/run-beebaa/driver.mjs        # default http://localhost:5173
```

What it does: reuses a running dev server or starts `npm run dev`
itself (and kills it on exit); clears stored scores for determinism;
plays a two-player round to an X win (asserts the 3-square winning
highlight and the score incrementing exactly once); switches to
vs-computer and asserts the "Computer is thinking…" delay and the
optimal center reply; fails on any page console error. Exit code 0 =
smoke passed.

Screenshots → `.claude/skills/run-beebaa/shots/` (gitignored):
`1-fresh.png`, `2-x-wins.png`, `3-vs-computer.png`. Look at them —
`2-x-wins.png` must show a green highlighted top row and "X wins: 1".

Squares are addressed by accessible label — `"top left, empty"` →
`"top left, X"` → `"top left, X, winning"` — which is how you extend
the driver to play other sequences.

## Run (human path)

```bash
npm run dev    # → http://localhost:5173, Ctrl-C to stop
```

Stop a stray server: `lsof -ti:5173 -sTCP:LISTEN | xargs -r kill`.

## Test

```bash
npm run test        # vitest: 44 tests, all pass (~3s)
npm run typecheck   # tsc -b: checks src AND vite.config.ts
npm run build       # tsc -b && vite build → dist/
```

## Gotchas

- **`sudo` needs a password in this WSL2 setup**, so
  `npx playwright install-deps` fails. The rootless fallback in
  `setup-deps.sh` extracts the three missing libs from .debs into
  `~/.cache/beebaa-chromium-libs/`; the driver auto-prepends that
  path to `LD_LIBRARY_PATH` when present.
- **`libasound2t64` is pinned to `1.2.11-1ubuntu0.4`** and fetched by
  direct URL: the local apt index points at a version that 404s on
  the mirror, and the mirror's newer builds (1.2.15+) require
  GLIBC 2.43, newer than this system's. If the pinned URL ever 404s,
  pick another `1.2.11-*` build from
  `http://archive.ubuntu.com/ubuntu/pool/main/a/alsa-lib/`.
- **Kill the port listener, not the npm wrapper.** npm doesn't forward
  SIGTERM to Vite; the driver spawns it detached and kills the process
  group. If you launch `npm run dev &` manually, stop it via the
  `lsof` line above or the port stays bound (`EADDRINUSE`).
- **The computer's reply takes ~400ms** by design. Wait for the DOM
  (`getByLabel('middle center, O')`), not a fixed sleep.
- **Vs-computer, the human is always X and opens; the computer is O.**
  There is no side selection — don't hunt for it.

## Troubleshooting

- **`error while loading shared libraries: libnspr4.so`** (or libnss3 /
  libasound): setup was skipped or `~/.cache/beebaa-chromium-libs` was
  deleted. Re-run `bash .claude/skills/run-beebaa/setup-deps.sh`.
- **`browserType.launch: Executable doesn't exist`**: Playwright's
  Chromium isn't downloaded. `npx playwright install chromium`.
- **`dev server did not come up in 30s`**: check nothing else holds
  port 5173 (`lsof -i:5173`) and that `npm install` has run.
