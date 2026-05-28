#!/bin/bash
set -euo pipefail

BUCKET="hosea.ru"
BUILD_DIR="out"
PARALLEL_JOBS=8

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

echo -e "${YELLOW}📦 Загрузка в Object Storage...${NC}"

upload_file() {
  local file="$1"
  local rel="${file#$BUILD_DIR/}"
  local content_type

  case "$file" in
    *.html)  content_type="text/html; charset=utf-8" ;;
    *.css)   content_type="text/css; charset=utf-8" ;;
    *.js)    content_type="application/javascript; charset=utf-8" ;;
    *.json)  content_type="application/json; charset=utf-8" ;;
    *.svg)   content_type="image/svg+xml" ;;
    *.png)   content_type="image/png" ;;
    *.jpg|*.jpeg) content_type="image/jpeg" ;;
    *.webp)  content_type="image/webp" ;;
    *.ico)   content_type="image/x-icon" ;;
    *.woff2) content_type="font/woff2" ;;
    *.woff)  content_type="font/woff" ;;
    *.ttf)   content_type="font/ttf" ;;
    *.xml)   content_type="application/xml" ;;
    *.txt)   content_type="text/plain; charset=utf-8" ;;
    *)       content_type="application/octet-stream" ;;
  esac

  if [ "$DRY_RUN" = true ]; then
    echo "  $rel → $content_type"
    return 0
  fi

  yc storage s3 cp "$file" "s3://${BUCKET}/${rel}" \
    --content-type "$content_type" --quiet 2>/dev/null
}

# Собрать список файлов
FILES=()
while IFS= read -r -d '' f; do
  FILES+=("$f")
done < <(find "$BUILD_DIR" -type f ! -name '.DS_Store' -print0)

TOTAL=${#FILES[@]}
COUNT=0
START_TIME=$(date +%s)

for file in "${FILES[@]}"; do
  # Запускаем в фоне, весь вывод в /dev/null
  (upload_file "$file") &>/dev/null &
  COUNT=$((COUNT + 1))

  # Прогресс каждые 5 файлов
  if [ $((COUNT % 5)) -eq 0 ]; then
    ELAPSED=$(( $(date +%s) - START_TIME ))
    printf "  📄 %d / %d (за %ds)\n" "$COUNT" "$TOTAL" "$ELAPSED"
  fi

  # Ждём каждые PARALLEL_JOBS фоновых задач
  if [ $((COUNT % PARALLEL_JOBS)) -eq 0 ]; then
    wait
  fi
done

# Ждём оставшиеся
wait

# Финальный прогресс
ELAPSED=$(( $(date +%s) - START_TIME ))
printf "  📄 %d / %d (за %ds)\n" "$TOTAL" "$TOTAL" "$ELAPSED"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${GREEN}🧪 Сухой прогон: ${TOTAL} файлов${NC}"
else
  echo -e "${GREEN}✅ Готово! Загружено ${TOTAL} файлов за ${ELAPSED}с${NC}"
fi
