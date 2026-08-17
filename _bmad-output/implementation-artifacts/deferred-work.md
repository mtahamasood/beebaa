# Deferred Work

- source_spec: `_bmad-output/implementation-artifacts/spec-tic-tac-toe-game.md`
  summary: Add a README with project description and run instructions (install, dev, test, build).
  evidence: Review noted the acceptance criteria start from "a fresh clone" yet nothing in the repo documents the commands; the spec never asked for docs, so it was out of scope for this story.

- source_spec: `_bmad-output/implementation-artifacts/spec-tic-tac-toe-game.md`
  summary: Add lint/format tooling (ESLint + Prettier) and a CI workflow running typecheck, tests, and build.
  evidence: Review noted the acceptance criteria are only verified manually; the project has a full test suite but no automated gate. Out of the spec's scope.

- source_spec: `_bmad-output/implementation-artifacts/spec-tic-tac-toe-game.md`
  summary: Upgrade the dev toolchain (vite 5 → current, vitest 2 → current) to clear the esbuild dev-server advisory GHSA-67mh-4wv8-2f99 reported by npm audit.
  evidence: npm audit reports 5 findings, all tracing to esbuild <=0.24.2 via the vite 5 / vitest 2 chain; dev-server only, nothing ships in the production bundle, and the fix is a breaking major bump — a deliberate upgrade story, not a patch.

- source_spec: `_bmad-output/implementation-artifacts/spec-github-actions-ci.md`
  summary: Add a lint/format script (ESLint + Prettier) and a matching step in the CI workflow.
  evidence: CI review noted the gate covers typecheck/test/build only; package.json has no lint script, so style issues pass the gate invisibly.

- source_spec: `_bmad-output/implementation-artifacts/spec-github-actions-ci.md`
  summary: Consider migrating master's classic branch protection to a GitHub repository ruleset.
  evidence: Review noted rulesets are GitHub's successor to classic protection, with better auditing and bypass-actor lists that would solve the solo-maintainer break-glass problem more cleanly than toggling enforce_admins.
