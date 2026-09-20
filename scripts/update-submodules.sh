#!/usr/bin/env bash
# ==============================================================================
# update-submodules.sh
# 外部サブモジュール（8件）の上流最新コミットを一括取得・同期するスクリプト
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== Submodule Update Process Started ==="
cd "${ROOT_DIR}"

# 1. サブモジュールの初期化（未初期化がある場合に対応。再帰的サブモジュールは除外）
echo "--> Initializing uninitialized vendor submodules..."
git submodule update --init

# 2. .gitmodules に指定された追従ブランチから上流の最新コミットを取得・マージ
echo "--> Pulling latest changes from remote tracking branches..."
git submodule update --remote --merge

echo ""
echo "=== Current Submodule Status ==="
git submodule status

echo ""
echo "=== Summary of Changes (if any) ==="
git status -s vendor/

echo ""
echo "Submodule update completed successfully."
echo "If submodules were updated, commit the changes with: git commit -am 'chore: update submodules to latest'"
