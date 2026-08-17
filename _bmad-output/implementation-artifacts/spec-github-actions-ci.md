---
title: 'GitHub Actions CI and Branch Protection'
type: 'chore'
created: '2026-08-18'
status: 'done'
route: 'one-shot'
---

# GitHub Actions CI and Branch Protection

## Intent

**Problem:** The project's quality gates (typecheck, tests, build) only ran when someone remembered to run them locally; `master` on the new GitHub repo (mtahamasood/beebaa) accepted any push.

**Approach:** A single hardened GitHub Actions workflow (`ci`) running typecheck → test → build on pushes to master, PRs, and manual dispatch; classic branch protection on `master` requiring that check (strict, Actions-app-bound), PRs before merge (0 approvals — solo maintainer), linear history, admin enforcement, and no force-pushes/deletions; repo merge settings aligned (squash/rebase only, auto-merge on, delete branch on merge). Verified live: PR #1 was gated by the check and squash-merged only after it passed.

## Suggested Review Order

**The CI gate**

- Typecheck, test, build as separate steps for failure attribution; `tsc -b` dedupes via tsbuildinfo.
  [`ci.yml:38`](../../.github/workflows/ci.yml#L38)

- Job display name IS the required-check context — the comment documents the rename and matrix traps.
  [`ci.yml:20`](../../.github/workflows/ci.yml#L20)

- PR runs cancel when superseded; master pushes always finish, keeping post-merge signal.
  [`ci.yml:14`](../../.github/workflows/ci.yml#L14)

**Supply-chain hardening**

- Actions pinned to commit SHAs, not mutable tags; read-only token, credentials not persisted.
  [`ci.yml:29`](../../.github/workflows/ci.yml#L29)

- Dependabot keeps the SHA pins fresh weekly.
  [`dependabot.yml:1`](../../.github/dependabot.yml#L1)

**Version alignment**

- One Node source of truth: `.nvmrc` consumed via `node-version-file`.
  [`.nvmrc:1`](../../.nvmrc#L1)

**Settings applied outside the repo (via `gh api`, not files)**

- Branch protection on `master`: required check `ci` (strict, app_id 15368), PRs required (0 approvals), `enforce_admins`, linear history, conversation resolution, force-push/deletion blocked.
- Repo merge config: merge commits off (squash/rebase only — companion to linear history), auto-merge on, head branches auto-deleted.
- Break-glass (Actions outage): `gh api -X DELETE repos/mtahamasood/beebaa/branches/master/protection/enforce_admins` re-enables admin bypass; re-enable with `-X POST` afterwards.
