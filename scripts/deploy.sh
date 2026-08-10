#!/bin/bash
set -euo pipefail

BUCKET="hosea.ru"
BUILD_DIR="out"
ENDPOINT="https://storage.yandexcloud.net"
MANIFEST_KEY=".deploy/manifest.json"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

DEPLOY_START=$(date +%s)
echo -e "${CYAN}🚀 Деплой начат: $(date '+%H:%M:%S')${NC}"

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# ── Parse flags ──────────────────────────────────
DRY_RUN=false
FULL_SYNC=false
APPLY_CACHE=false
for arg in "$@"; do
  if [ "$arg" = "--dry-run" ]; then DRY_RUN=true; fi
  if [ "$arg" = "--full" ]; then FULL_SYNC=true; fi
  if [ "$arg" = "--apply-cache" ]; then APPLY_CACHE=true; fi
done

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}🧪 Сухой прогон${NC}"
fi

# ── Sync options ─────────────────────────────────
# Assets (CSS/JS/images): filenames contain content hashes → size-only is safe.
# HTML files: content can change without size changing (same-length chunk names)
# → use MD5 manifest via sync-manifest.py.
#
# Cache-Control: у файлов со стабильными URL между деплоями (HTML и _next/data/*.json)
# браузер кэширует старую версию и после SPA-навигации показывает устаревшие данные
# (свежий пост «пропадает» с главной). Поэтому:
#  - хешированные ассеты (_next/static/*) — новый URL при изменении → immutable
#  - HTML и данные (_next/data/*.json) — URL стабилен → no-cache (всегда ревалидируем)
CACHE_IMMUTABLE="public, max-age=31536000, immutable"
CACHE_NO_CACHE="no-cache"

# Общие исключения для не-HTML ассетов
ASSET_BASE="--exclude=.DS_Store --exclude=*.html --exclude=.deploy/*"

# Pass 1a: только хешированные ассеты → immutable
SYNC_STATIC_OPTS="--exclude=* --include=_next/static/* $ASSET_BASE --delete --cache-control=\"$CACHE_IMMUTABLE\""
# Pass 1b: всё остальное (картинки, _next/data, robots…) → no-cache
SYNC_DATA_OPTS="$ASSET_BASE --exclude=_next/static/* --delete --cache-control=\"$CACHE_NO_CACHE\""
if [ "$FULL_SYNC" = false ]; then
  SYNC_STATIC_OPTS="$SYNC_STATIC_OPTS --size-only"
  SYNC_DATA_OPTS="$SYNC_DATA_OPTS --size-only"
fi

# ── Pre-flight: bucket config ────────────────────

if [ "$DRY_RUN" = false ]; then
  BUCKET_INFO=$(yc storage bucket get --name "$BUCKET" 2>/dev/null || echo "")
  if ! echo "$BUCKET_INFO" | grep -q "read: true"; then
    echo -e "${YELLOW}🔧 Включаю публичный доступ к бакету...${NC}"
    yc storage bucket update --name "$BUCKET" --public-read --public-list > /dev/null 2>&1
  fi
  if ! echo "$BUCKET_INFO" | grep -q "index: index.html"; then
    echo -e "${YELLOW}🔧 Включаю статический хостинг...${NC}"
    yc storage bucket update --name "$BUCKET" \
      --website-settings '{"index": "index.html", "error": "404.html"}' > /dev/null 2>&1
  fi
fi

# ─────────── Build ───────────────────────────────
echo -e "${YELLOW}🗑️  Очистка кеша Next.js...${NC}"
rm -rf .next/cache

echo -e "${YELLOW}🔨 Сборка статики...${NC}"
npm run build

# 404 страница в корень (Object Storage ожидает 404.html)
if [ -f "$BUILD_DIR/404/index.html" ]; then
  cp "$BUILD_DIR/404/index.html" "$BUILD_DIR/404.html"
  echo -e "  ${GREEN}404.html скопирована в корень${NC}"
fi

# ─────────── Sync ────────────────────────────────
echo -e "${YELLOW}📦 Синхронизация с Object Storage...${NC}"

SYNC_ELAPSED=0

# ── Helper: sync with progress bar ───────────────
sync_with_progress() {
  local label="$1" opts="$2"
  local to_sync
  to_sync=$(eval aws s3 sync "$BUILD_DIR" "s3://${BUCKET}" \
    --endpoint-url "$ENDPOINT" \
    $opts \
    --dryrun 2>&1 | grep -cE '^\(dryrun\)' || true)

  if [ "$to_sync" -eq 0 ] 2>/dev/null; then
    echo -e "   ${GREEN}✓ $label — всё актуально${NC}" >&2
    echo "0"
  else
    eval aws s3 sync "$BUILD_DIR" "s3://${BUCKET}" \
      --endpoint-url "$ENDPOINT" \
      $opts \
      --no-progress \
      | python3 -u -c "
import sys

files_to_sync = ${to_sync}
count = 0

for line in sys.stdin:
    if line.startswith('upload:') or line.startswith('delete:') or line.startswith('copy:'):
        count += 1
        pct = int(count * 100 / files_to_sync)
        bar_len = 20
        filled = int(bar_len * count / files_to_sync)
        bar = '█' * filled + '░' * (bar_len - filled)
        sys.stderr.write(f'\033[K\r   {bar} {pct}%  ({count}/{files_to_sync})')
        sys.stderr.flush()

sys.stderr.write('\n')
"
    echo "$to_sync"
  fi
}

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}   --- dry-run (static, immutable) ---${NC}"
  eval aws s3 sync "$BUILD_DIR" "s3://${BUCKET}" \
    --endpoint-url "$ENDPOINT" \
    $SYNC_STATIC_OPTS \
    --dryrun
  echo -e "${YELLOW}   --- dry-run (data, no-cache) ---${NC}"
  eval aws s3 sync "$BUILD_DIR" "s3://${BUCKET}" \
    --endpoint-url "$ENDPOINT" \
    $SYNC_DATA_OPTS \
    --dryrun
  echo -e "${YELLOW}   --- dry-run (HTML) ---${NC}"
  # Для HTML показываем diff через manifest
  python3 scripts/sync-manifest.py "$BUILD_DIR" "$BUCKET" "$ENDPOINT" "$MANIFEST_KEY" > /dev/null
else
  START_TIME=$(date +%s)

  # ── Phase 1a: hashed static assets → immutable ─
  echo -e "   ${YELLOW}── Ассеты (_next/static, immutable) ──${NC}"
  STATIC_COUNT=$(sync_with_progress "Статика (immutable)" "$SYNC_STATIC_OPTS")

  # ── Phase 1b: data/JSON/images → no-cache ─────
  echo -e "   ${YELLOW}── Данные/картинки (no-cache) ──${NC}"
  DATA_COUNT=$(sync_with_progress "Данные/картинки" "$SYNC_DATA_OPTS")

  # ── Phase 2: HTML (manifest-based) → no-cache ─
  echo -e "   ${YELLOW}── HTML (no-cache) ──${NC}"
  HTML_COUNT=$(python3 scripts/sync-manifest.py "$BUILD_DIR" "$BUCKET" "$ENDPOINT" "$MANIFEST_KEY")

  # ── Phase 3 (одноразово): применить Cache-Control к уже загруженным файлам ──
  if [ "$APPLY_CACHE" = true ]; then
    echo -e "   ${YELLOW}── Применяю Cache-Control ко всем файлам (одноразово) ──${NC}"
    # HTML → no-cache
    aws s3 cp "$BUILD_DIR" "s3://${BUCKET}" --recursive \
      --exclude "*" --include "*.html" \
      --endpoint-url "$ENDPOINT" --cache-control "$CACHE_NO_CACHE" --no-progress
    # Next.js data JSON → no-cache
    aws s3 cp "$BUILD_DIR/_next/data" "s3://${BUCKET}/_next/data" --recursive \
      --endpoint-url "$ENDPOINT" --cache-control "$CACHE_NO_CACHE" --no-progress
    # Хешированные ассеты → immutable
    aws s3 cp "$BUILD_DIR/_next/static" "s3://${BUCKET}/_next/static" --recursive \
      --endpoint-url "$ENDPOINT" --cache-control "$CACHE_IMMUTABLE" --no-progress
  fi

  SYNC_ELAPSED=$(( $(date +%s) - START_TIME ))
fi

# ─────────── Summary ─────────────────────────────
TOTAL_ELAPSED=$(( $(date +%s) - DEPLOY_START ))

FILE_COUNT=$(find "$BUILD_DIR" -type f -name '*.html' | wc -l | tr -d ' ')

echo ""
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Деплой завершён${NC}"
echo ""
echo -e "   ${CYAN}⏱  Время: ${TOTAL_ELAPSED} с (загрузка: ${SYNC_ELAPSED} с)${NC}"
echo -e "   ${CYAN}📄 HTML-страниц: ${FILE_COUNT}${NC}"
