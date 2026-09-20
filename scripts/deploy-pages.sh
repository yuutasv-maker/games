#!/usr/bin/env bash
# ==============================================================================
# deploy-pages.sh
# docs/ ディレクトリを GitHub Pages (gh-pages ブランチ) へ強制同期・デプロイするスクリプト
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

echo "=== Deploying to GitHub Pages (gh-pages branch) ==="

# 1. main ブランチの変更をプッシュ
echo "--> Pushing main branch..."
git push origin main

# 2. docs/ を gh-pages ブランチへ subtree split して push
echo "--> Pushing docs/ to gh-pages branch..."
SPLIT_COMMIT=$(git subtree split --prefix docs main)
git push origin "${SPLIT_COMMIT}:gh-pages" --force

echo ""
echo "=== Deployment Successful ==="
echo "GitHub Pages URL: https://yuutasv-maker.github.io/games/"
