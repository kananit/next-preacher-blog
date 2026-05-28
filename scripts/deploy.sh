#!/bin/bash
set -euo pipefail

BUCKET="hosea.ru"
BUILD_DIR="out"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Pre-flight: проверить публичный доступ к бакету
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

echo -e "${YELLOW}🔨 Сборка статики...${NC}"
npm run build

# Скопировать 404 страницу в корень (Object Storage ожидает 404.html)
if [ -f "$BUILD_DIR/404/index.html" ]; then
  cp "$BUILD_DIR/404/index.html" "$BUILD_DIR/404.html"
  echo "  404 страница скопирована в корень"
fi

echo -e "${YELLOW}📦 Синхронизация с Object Storage...${NC}"

ENDPOINT="https://storage.yandexcloud.net"

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}   --- dry-run: список файлов ---${NC}"
  aws s3 sync "$BUILD_DIR" "s3://${BUCKET}" \
    --endpoint-url "$ENDPOINT" \
    --exclude ".DS_Store" \
    --delete \
    --dryrun
else
  START_TIME=$(date +%s)
  aws s3 sync "$BUILD_DIR" "s3://${BUCKET}" \
    --endpoint-url "$ENDPOINT" \
    --exclude ".DS_Store" \
    --delete
  ELAPSED=$(( $(date +%s) - START_TIME ))
  echo ""
  echo -e "${GREEN}✅ Готово за ${ELAPSED}с${NC}"
fi
