#!/bin/bash
# Vercelビルドエラー自動検知・修正スクリプト
# launchd から5分ごとに実行される

set -euo pipefail

# ===== 設定 =====
PROJECT_DIR="/Users/ai/projects/personal/pharma-exam-ai"
REPO="makio8/pharma-exam-ai"
LOG_FILE="/tmp/claude/pharma-vercel-autofix.log"
LOCK_FILE="/tmp/claude/pharma-vercel-autofix.lock"
LAST_FIXED_FILE="/tmp/claude/pharma-last-fixed-sha"

# バイナリのフルパス（launchdはPATHが限られるため）
GH="/opt/homebrew/bin/gh"
CLAUDE="/Users/ai/.local/bin/claude"
NPM="/opt/homebrew/bin/npm"
GIT="/usr/bin/git"

# ===== ログ関数 =====
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# ===== 二重実行防止 =====
if [ -f "$LOCK_FILE" ]; then
  log "Already running, skipping"
  exit 0
fi
touch "$LOCK_FILE"
trap "rm -f '$LOCK_FILE'" EXIT

log "=== Check started ==="

# ===== Production デプロイメント一覧取得 =====
DEPLOYMENTS=$("$GH" api "repos/$REPO/deployments" \
  --jq '[.[] | select(.environment | startswith("Production"))] | .[0:3]' 2>&1) || {
  log "ERROR: gh api failed: $DEPLOYMENTS"
  exit 1
}

if [ "$DEPLOYMENTS" = "[]" ]; then
  log "No production deployments found"
  exit 0
fi

# 最初の失敗しているデプロイメントを探す
FAILED_ID=""
FAILED_SHA=""
while IFS= read -r line; do
  DEP_ID=$(echo "$line" | /usr/bin/python3 -c "import sys,json; d=json.load(sys.stdin); print(d['id'])")
  DEP_SHA=$(echo "$line" | /usr/bin/python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('sha',''))")
  DEP_ENV=$(echo "$line" | /usr/bin/python3 -c "import sys,json; d=json.load(sys.stdin); print(d['environment'])")

  STATE=$("$GH" api "repos/$REPO/deployments/$DEP_ID/statuses" \
    --jq '.[0].state' 2>/dev/null || echo "unknown")

  log "  Deployment $DEP_ID ($DEP_ENV): $STATE"

  if [ "$STATE" = "failure" ]; then
    FAILED_ID="$DEP_ID"
    FAILED_SHA="$DEP_SHA"
    break
  fi
done < <(echo "$DEPLOYMENTS" | /usr/bin/python3 -c "
import sys, json
data = json.load(sys.stdin)
for d in data:
    print(json.dumps(d))
")

if [ -z "$FAILED_ID" ]; then
  log "No failed deployments found"
  exit 0
fi

log "Failed deployment found: $FAILED_ID (SHA: $FAILED_SHA)"

# ===== 同じSHAを既に修正済みならスキップ =====
if [ -f "$LAST_FIXED_FILE" ]; then
  LAST_FIXED=$(cat "$LAST_FIXED_FILE")
  if [ "$LAST_FIXED" = "$FAILED_SHA" ]; then
    log "Already attempted fix for SHA $FAILED_SHA, skipping"
    exit 0
  fi
fi

# [auto-fix] コミットによる失敗なら無限ループ防止でスキップ
cd "$PROJECT_DIR"
COMMIT_MSG=$("$GIT" log -1 --format=%s "$FAILED_SHA" 2>/dev/null || echo "")
if echo "$COMMIT_MSG" | grep -q "\[auto-fix\]"; then
  log "Failed commit was an auto-fix itself, skipping to prevent loop"
  exit 0
fi

log "Attempting auto-fix..."
echo "$FAILED_SHA" > "$LAST_FIXED_FILE"

# ===== mainブランチを最新に =====
"$GIT" fetch origin main 2>> "$LOG_FILE"
"$GIT" checkout main 2>> "$LOG_FILE"
"$GIT" pull origin main 2>> "$LOG_FILE"

# ===== Claude Codeで修正 =====
log "Running Claude Code to fix build errors..."
"$CLAUDE" --dangerously-skip-permissions -p \
  "Vercelの本番デプロイが失敗しました。ビルドエラーを修正してください。

手順:
1. npm run build を実行してエラーを確認する
2. TypeScriptエラー・未使用importなどを修正する（最小限の変更のみ）
3. npx tsc --noEmit でも確認する
4. npm run build が通ることを確認する

制約:
- 最小限の修正のみ（機能追加・リファクタリング不要）
- コミット・pushはしない（このスクリプトが後で行う）" \
  2>> "$LOG_FILE" || {
  log "ERROR: claude failed"
  exit 1
}

# ===== ビルド確認 =====
log "Verifying build..."
if ! "$NPM" run build >> "$LOG_FILE" 2>&1; then
  log "ERROR: Build still failing after Claude's fix"
  exit 1
fi

# ===== 変更があればコミット&push =====
if [ -n "$("$GIT" status --porcelain)" ]; then
  "$GIT" config user.name "Claude Code Bot"
  "$GIT" config user.email "noreply@anthropic.com"
  "$GIT" add -A
  "$GIT" commit -m "fix: [auto-fix] Vercelビルドエラー自動修正"
  "$GIT" push origin main
  log "✅ Fix committed and pushed successfully"
else
  log "ℹ️ Build passed but no file changes"
fi

log "=== Check completed ==="
