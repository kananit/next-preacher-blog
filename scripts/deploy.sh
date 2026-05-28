#!/bin/bash
set -euo pipefail

BUCKET="hosea.ru"
BUILD_DIR="out"

# Цвета для вывода
GREEN='\033[0;32m'
NC='\033[0m'

# Загрузить переменные из .env, если есть
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

DRY_RUN=false
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=true
  echo "🧪 Сухой прогон — файлы не будут загружены"
fi

echo "🔨 Сборка статики..."
npm run build

# Счётчик для статистики
TOTAL=0

upload() {
  local src="$1"
  local dst="$2"
  local content_type="$3"

  if [ "$DRY_RUN" = true ]; then
    echo "  [dry] $dst → $content_type"
    return
  fi

  yc storage s3 cp "$src" "s3://${BUCKET}/${dst}" \
    --content-type "$content_type" --quiet
}

echo "📦 Загрузка файлов в Object Storage..."

# Обход всех файлов в out/
while read -r file; do
  # Убираем префикс BUILD_DIR/
  rel="${file#$BUILD_DIR/}"

  case "$file" in
    *.html)  upload "$file" "$rel" "text/html; charset=utf-8" ;;
    *.css)   upload "$file" "$rel" "text/css; charset=utf-8" ;;
    *.js)    upload "$file" "$rel" "application/javascript; charset=utf-8" ;;
    *.json)  upload "$file" "$rel" "application/json; charset=utf-8" ;;
    *.svg)   upload "$file" "$rel" "image/svg+xml" ;;
    *.png)   upload "$file" "$rel" "image/png" ;;
    *.jpg|*.jpeg) upload "$file" "$rel" "image/jpeg" ;;
    *.webp)  upload "$file" "$rel" "image/webp" ;;
    *.ico)   upload "$file" "$rel" "image/x-icon" ;;
    *.woff2) upload "$file" "$rel" "font/woff2" ;;
    *.woff)  upload "$file" "$rel" "font/woff" ;;
    *.ttf)   upload "$file" "$rel" "font/ttf" ;;
    *.xml)   upload "$file" "$rel" "application/xml" ;;
    *.txt)   upload "$file" "$rel" "text/plain; charset=utf-8" ;;
    *)       upload "$file" "$rel" "application/octet-stream" ;;
  esac

  TOTAL=$((TOTAL + 1))
done < <(find "$BUILD_DIR" -type f | sort)

echo ""
if [ "$DRY_RUN" = true ]; then
  echo "🧪 Сухой прогон завершён. Будет загружено ${TOTAL} файлов."
else
  echo -e "${GREEN}✅ Готово! Загружено ${TOTAL} файлов.${NC}"
fi
