#!/usr/bin/env bash
# push-to-github.sh — push latest commits to GitHub
# Usage: bash scripts/push-to-github.sh [optional commit message]
# Requires: GITHUB_PERSONAL_ACCESS_TOKEN in environment

set -euo pipefail

REPO="JBlizzard-sketch/soko-moto"
BRANCH="main"

if [ -z "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]; then
  echo "❌  GITHUB_PERSONAL_ACCESS_TOKEN is not set"
  exit 1
fi

# Ensure remote is configured correctly
REMOTE_URL="https://JBlizzard-sketch:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/${REPO}.git"

if git remote get-url origin &>/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

# Stage and commit if there are changes
if ! git --no-optional-locks diff --quiet HEAD 2>/dev/null || \
   ! git --no-optional-locks diff --cached --quiet 2>/dev/null; then
  MSG="${1:-Auto-sync: $(date '+%Y-%m-%d %H:%M')}"
  git add -A
  git commit -m "$MSG"
  echo "✅  Committed: $MSG"
else
  echo "ℹ️   Working tree is clean — nothing to commit"
fi

# Push
git push origin "$BRANCH"
echo "🚀  Pushed to github.com/${REPO} (${BRANCH})"
