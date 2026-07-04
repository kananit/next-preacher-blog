#!/bin/bash
set -euo pipefail

BUCKET="hosea.ru"
BUILD_DIR="out"
ENDPOINT="https://storage.yandexcloud.net"

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

DRY_RUN=false
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=true
  echo -e "${YELLOW}🧪 Сухой прогон${NC}"
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
echo -e "${YELLOW}🗑️  Очистка fetch-кеша Next.js...${NC}"
rm -rf .next/cache/fetch-cache

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

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}   --- dry-run ---${NC}"
  aws s3 sync "$BUILD_DIR" "s3://${BUCKET}" \
    --endpoint-url "$ENDPOINT" \
    --exclude ".DS_Store" \
    --size-only \
    --delete \
    --dryrun
else
  START_TIME=$(date +%s)

  # Подсчитать файлы к синхронизации
  TO_SYNC=$(aws s3 sync "$BUILD_DIR" "s3://${BUCKET}" \
    --endpoint-url "$ENDPOINT" \
    --exclude ".DS_Store" \
    --size-only \
    --delete \
    --dryrun 2>&1 | grep -cE '^\(dryrun\)' || true)

  if [ "$TO_SYNC" -eq 0 ] 2>/dev/null; then
    SYNC_ELAPSED=$(( $(date +%s) - START_TIME ))
    echo -e "   ${GREEN}✓ Всё актуально, загрузка не требуется${NC}"
  else
    echo -e "   ${YELLOW}Файлов к загрузке: ${TO_SYNC}${NC}"
    aws s3 sync "$BUILD_DIR" "s3://${BUCKET}" \
      --endpoint-url "$ENDPOINT" \
      --exclude ".DS_Store" \
      --size-only \
      --delete \
      --no-progress \
      | python3 -u -c "
import sys

files_to_sync = ${TO_SYNC}
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
    SYNC_ELAPSED=$(( $(date +%s) - START_TIME ))
  fi
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
