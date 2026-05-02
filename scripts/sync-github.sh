#!/usr/bin/env bash
# sync-github.sh — sync latest Replit checkpoint to GitHub
# Called automatically at startup and can be run anytime
# Usage: bash scripts/sync-github.sh

set -euo pipefail

REPO="JBlizzard-sketch/soko-moto"
BRANCH="main"

if [ -z "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]; then
  echo "⚠️  GITHUB_PERSONAL_ACCESS_TOKEN not set — skipping GitHub sync"
  exit 0
fi

REMOTE_URL="https://JBlizzard-sketch:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/${REPO}.git"

# Ensure remote is configured
git remote get-url origin &>/dev/null 2>&1 \
  && git remote set-url origin "$REMOTE_URL" \
  || git remote add origin "$REMOTE_URL"

# Push HEAD to GitHub (only if there are commits ahead)
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git ls-remote origin "$BRANCH" 2>/dev/null | awk '{print $1}')

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "✅  GitHub is already up to date ($(git rev-parse --short HEAD))"
else
  git push origin "$BRANCH" --force-with-lease 2>&1 || git push origin "$BRANCH"
  echo "🚀  Pushed $(git rev-parse --short HEAD) to github.com/${REPO}"
fi
