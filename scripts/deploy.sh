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
# Pass 1b1: данные Next.js (_next/data) → no-cache. БЕЗ --size-only:
#   контент может измениться при том же размере, а URL стабилен → синхронизируем всегда
SYNC_DATA_OPTS="--exclude=* --include=_next/data/* $ASSET_BASE --delete --cache-control=\"$CACHE_NO_CACHE\""
# Pass 1b2: картинки и прочее (robots, favicon…) → no-cache
SYNC_IMAGES_OPTS="$ASSET_BASE --exclude=_next/static/* --exclude=_next/data/* --delete --cache-control=\"$CACHE_NO_CACHE\""
# Та же выборка HTML, что собирает sync-manifest.py, но через aws: нужна только
# в dry-run, где по MD5 не сравнить (боевой проход идёт по манифесту).
SYNC_HTML_OPTS="--exclude=* --include=*.html --delete --cache-control=\"$CACHE_NO_CACHE\""
if [ "$FULL_SYNC" = false ]; then
  SYNC_STATIC_OPTS="$SYNC_STATIC_OPTS --size-only"
  SYNC_IMAGES_OPTS="$SYNC_IMAGES_OPTS --size-only"
fi

# ── Pre-flight: доступ к бакету ────────────────
# Проверяем S3-доступ до сборки: без него `aws s3 sync` падает в самом конце,
# уже после нескольких минут билда.

fail() {
  echo -e "${RED}❌ $1${NC}"
  exit 1
}

if ! AWS_ERR=$(aws s3 ls "s3://${BUCKET}/" --endpoint-url "$ENDPOINT" 2>&1 > /dev/null); then
  fail "Object Storage: нет доступа к s3://${BUCKET} — ${AWS_ERR}"
fi
echo -e "   ${GREEN}✓ Object Storage — s3://${BUCKET}${NC}"

# `yc` нужен только для настроек бакета (публичное чтение, хостинг); сама заливка
# идёт по S3. CLI ходит в API Cloud отдельно и падает в сети без маршрута до его
# адресов (IPv6), поэтому здесь только предупреждение — остановка была бы ложной.
if ! BUCKET_INFO=$(yc storage bucket get --name "$BUCKET" 2>&1); then
  BUCKET_ERR=${BUCKET_INFO%%$'\n'*}
  BUCKET_INFO=""
  echo -e "${YELLOW}⚠️  yc: бакет ${BUCKET} не проверен — ${BUCKET_ERR:-нет ответа от yc}${NC}"
  echo -e "${YELLOW}   Публичное чтение и хостинг в этом деплое не выставляются${NC}"
fi

if [ "$DRY_RUN" = false ] && [ -n "$BUCKET_INFO" ]; then
  if ! echo "$BUCKET_INFO" | grep -q "read: true"; then
    echo -e "${YELLOW}🔧 Включаю публичный доступ к бакету...${NC}"
    yc storage bucket update --name "$BUCKET" --public-read --public-list > /dev/null 2>&1
  fi
  # Проверить, включён ли хостинг, нечем: `yc storage bucket get` этой версии CLI
  # не отдаёт website_settings, поэтому условие из grep было всегда ложным.
  # Команда идёт каждый деплой — так и написано в сообщении.
  echo -e "${YELLOW}🔧 Статический хостинг: index.html / 404.html (CLI не показывает — ставлю заново)${NC}"
  yc storage bucket update --name "$BUCKET" \
    --website-settings '{"index": "index.html", "error": "404.html"}' > /dev/null 2>&1
fi

# ─────────── Build ───────────────────────────────
echo -e "${YELLOW}🗑️  Очистка кеша Next.js...${NC}"
rm -rf .next/cache

echo -e "${YELLOW}🔨 Сборка (yarn build)...${NC}"
yarn build

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
    # Сравнение идёт по размеру (и дате в --full), поэтому честно только
    # «заливать нечего», а не «всё актуально».
    echo -e "   ${GREEN}✓ заливать нечего${NC}" >&2
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
    # Между пайпом и `echo` теряется код возврата aws, а `set -e` внутри функции
    # не срабатывает: её rc отбрасывается подстановкой `$( )`. Без этой проверки
    # провал заливки заканчивался «✅ Деплой завершён».
    rc=${PIPESTATUS[0]}
    if [ "$rc" -ne 0 ]; then
      echo -e "${RED}❌ $label: заливка провалилась (aws rc=${rc}), повтори деплой${NC}" >&2
      exit 1
    fi
    echo "$to_sync"
  fi
}

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}   --- dry-run (static, immutable) ---${NC}"
  eval aws s3 sync "$BUILD_DIR" "s3://${BUCKET}" \
    --endpoint-url "$ENDPOINT" \
    $SYNC_STATIC_OPTS \
    --dryrun
  echo -e "${YELLOW}   --- dry-run (data, no-cache, always) ---${NC}"
  eval aws s3 sync "$BUILD_DIR" "s3://${BUCKET}" \
    --endpoint-url "$ENDPOINT" \
    $SYNC_DATA_OPTS \
    --dryrun
  echo -e "${YELLOW}   --- dry-run (images, no-cache) ---${NC}"
  eval aws s3 sync "$BUILD_DIR" "s3://${BUCKET}" \
    --endpoint-url "$ENDPOINT" \
    $SYNC_IMAGES_OPTS \
    --dryrun
  echo -e "${YELLOW}   --- dry-run (HTML) ---${NC}"
  # Только --dryrun: sync-manifest.py заливает по-настоящему, и прежний вызов
  # выгружал HTML даже в сухом прогоне. Сравнение тут по размеру, а в бою по MD5,
  # поэтому список файлов может отличаться.
  eval aws s3 sync "$BUILD_DIR" "s3://${BUCKET}" \
    --endpoint-url "$ENDPOINT" \
    $SYNC_HTML_OPTS \
    --dryrun
else
  START_TIME=$(date +%s)

  # ── Phase 1a: hashed static assets → immutable ─
  echo -e "   ${YELLOW}── Ассеты (_next/static, immutable) ──${NC}"
  STATIC_COUNT=$(sync_with_progress "Статика (immutable)" "$SYNC_STATIC_OPTS")

  # ── Phase 1b1: данные Next.js → no-cache (всегда) ─
  echo -e "   ${YELLOW}── Данные (_next/data, no-cache, всегда) ──${NC}"
  DATA_COUNT=$(sync_with_progress "Данные (no-cache)" "$SYNC_DATA_OPTS")

  # ── Phase 1b2: картинки/прочее → no-cache ─────
  echo -e "   ${YELLOW}── Картинки/прочее (no-cache) ──${NC}"
  IMAGES_COUNT=$(sync_with_progress "Картинки/прочее" "$SYNC_IMAGES_OPTS")

  # ── Phase 2: HTML (manifest-based) → no-cache ─
  echo -e "   ${YELLOW}── HTML (no-cache) ──${NC}"
  if ! HTML_COUNT=$(python3 scripts/sync-manifest.py "$BUILD_DIR" "$BUCKET" "$ENDPOINT" "$MANIFEST_KEY"); then
    fail "HTML не залит, повтори деплой"
  fi

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

# Копию `out/404.html` не считаю: это тот же `out/404/index.html` под вторым ключом.
FILE_COUNT=$(find "$BUILD_DIR" -type f -name '*.html' -not -path "$BUILD_DIR/404.html" | wc -l | tr -d ' ')

echo ""
echo -e "${CYAN}═══════════════════════════════════════${NC}"
# В dry-run в бакет не улетает ничего: «✅ Деплой завершён» отчитывался об успехе,
# которого не было.
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}🧪 dry-run завершён — заливки не было${NC}"
  echo ""
  echo -e "   ${CYAN}⏱  Время: ${TOTAL_ELAPSED} с (без заливки)${NC}"
else
  echo -e "${GREEN}✅ Деплой завершён${NC}"
  echo ""
  echo -e "   ${CYAN}⏱  Время: ${TOTAL_ELAPSED} с (загрузка: ${SYNC_ELAPSED} с)${NC}"
fi
echo -e "   ${CYAN}Загружено: статика ${STATIC_COUNT:-0} · данные ${DATA_COUNT:-0} · картинки ${IMAGES_COUNT:-0} · HTML ${HTML_COUNT:-0}${NC}"
echo -e "   ${CYAN}HTML-страниц: ${FILE_COUNT}${NC}"
