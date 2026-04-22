#!/usr/bin/env bash
# One-shot hook installer. Points git at `scripts/hooks/` so the repo-tracked
# hooks in this directory run instead of the local `.git/hooks/` copies.
#
# Idempotent — safe to re-run after a fresh clone.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

chmod +x scripts/hooks/pre-commit
git config core.hooksPath scripts/hooks

echo "[hooks] core.hooksPath -> scripts/hooks"
echo "[hooks] pre-commit active: parity guard for src/tenant/**"
