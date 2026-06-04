# Деплой Next.js (Static Export) на Яндекс Cloud Object Storage

> Практическое руководство. Составлено на основе реального опыта миграции сайта preacher-blog.

## Содержание

1. [Подготовка проекта](#1-подготовка-проекта)
2. [Установка YC CLI](#2-установка-yc-cli)
3. [Создание инфраструктуры Яндекс Cloud](#3-создание-инфраструктуры-яндекс-cloud)
4. [Деплой-скрипт](#4-деплой-скрипт)
5. [SSL-сертификат (Let's Encrypt)](#5-ssl-сертификат-lets-encrypt)
6. [Подключение домена](#6-подключение-домена)
7. [DNS-записи](#7-dns-записи)

---

## 1. Подготовка проекта

### next.config.js

Для статического экспорта в Next.js 13.5+ (Inng 15) — заменить `next export` на встроенный механизм:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",        // вместо next export
  trailingSlash: true,     // чтобы ссылки работали с Object Storage
  images: {
    unoptimized: true,     // отключаем оптимизацию (нет сервера)
  },
};
module.exports = nextConfig;
```

### package.json (scripts)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "export": "npm run build",    // build сам генерирует out/ при output: "export"
    "start": "npx serve out"      // для локальной проверки статики
  }
}
```

### 404 страница

При `trailingSlash: true` Next.js генерирует `out/404/index.html`, а Object Storage ожидает `404.html` в корне. Нужно копировать:

```bash
cp out/404/index.html out/404.html
```

Скрипт деплоя делает это автоматически (см. ниже).

---

## 2. Установка YC CLI

```bash
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
exec -l $SHELL
yc init   # откроет браузер для OAuth-авторизации
```

---

## 3. Создание инфраструктуры Яндекс Cloud

### 3.1 Создать бакет

```bash
yc storage bucket create \
  --name your-domain.ru \
  --default-storage-class standard \
  --max-size 1073741824
```

> Имя бакета **обязательно** должно совпадать с доменом сайта.

### 3.2 Включить публичный доступ и статический хостинг

> ⚠️ Флаги `--public-read --public-list` при создании бакета часто не срабатывают. Включать отдельно:

```bash
yc storage bucket update --name your-domain.ru --public-read --public-list

yc storage bucket update --name your-domain.ru \
  --website-settings '{"index": "index.html", "error": "404.html"}'
```

### 3.3 Создать сервис-аккаунт для деплоя

```bash
# Создать аккаунт
yc iam service-account create --name your-domain-deployer

# Узнать FOLDER_ID
yc resource-manager folder list

# Назначить роль
# Формат: yc resource-manager folder add-access-binding <FOLDER_ID> \
#   --role storage.editor \
#   --subject serviceAccount:<SA_ID>
yc resource-manager folder add-access-binding <FOLDER_ID> \
  --role storage.editor \
  --subject serviceAccount:<SA_ID>

# Создать ключи доступа
yc iam access-key create --service-account-id <SA_ID>
```

Сохранить полученные `key_id` и `secret` в `.env`:

```
AWS_ACCESS_KEY_ID=<key_id>
AWS_SECRET_ACCESS_KEY=<secret>
```

Добавить `.env` в `.gitignore`.

---

## 4. Деплой-скрипт

> ⚠️ Яндекс Object Storage не определяет MIME-типы автоматически. Без явного `--content-type` CSS и JS будут отдаваться как `application/octet-stream`.

Создать `scripts/deploy.sh`:

```bash
#!/bin/bash
set -euo pipefail

BUCKET="your-domain.ru"
BUILD_DIR="out"
ENDPOINT="https://storage.yandexcloud.net"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Загрузить ключи из .env
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Pre-flight: проверить публичный доступ к бакету
if [ "${1:-}" != "--dry-run" ]; then
  BUCKET_INFO=$(yc storage bucket get --name "$BUCKET" 2>/dev/null || echo "")
  if ! echo "$BUCKET_INFO" | grep -q "read: true"; then
    echo -e "${YELLOW}🔧 Включаю публичный доступ...${NC}"
    yc storage bucket update --name "$BUCKET" --public-read --public-list > /dev/null 2>&1
  fi
  if ! echo "$BUCKET_INFO" | grep -q "index: index.html"; then
    echo -e "${YELLOW}🔧 Включаю статический хостинг...${NC}"
    yc storage bucket update --name "$BUCKET" \
      --website-settings '{"index": "index.html", "error": "404.html"}' > /dev/null 2>&1
  fi
fi

# Сборка
echo -e "${YELLOW}🔨 Сборка статики...${NC}"
npm run build

# 404 страница в корень
if [ -f "$BUILD_DIR/404/index.html" ]; then
  cp "$BUILD_DIR/404/index.html" "$BUILD_DIR/404.html"
  echo "  404 страница скопирована в корень"
fi

# Синхронизация с бакетом
echo -e "${YELLOW}📦 Синхронизация с Object Storage...${NC}"

if [ "${1:-}" = "--dry-run" ]; then
  echo -e "${YELLOW}   --- dry-run ---${NC}"
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
```

Сделать исполняемым:

```bash
chmod +x scripts/deploy.sh
```

Добавить в `package.json`:

```json
{
  "scripts": {
    "deploy": "bash scripts/deploy.sh",
    "deploy:dry": "bash scripts/deploy.sh --dry-run"
  }
}
```

### Почему aws s3 sync, а не yc storage s3 cp?

| Подход | Минусы |
|---|---|
| `yc storage s3 cp` по одному файлу | Очень медленно (~2 мин на 150 файлов), нет `--delete` |
| `aws s3 sync` | Многопоточный, только изменённые файлы, auto-MIME, `--delete` |

AWS CLI определяет MIME-типы по расширению автоматически. Через `--endpoint-url` работает с Яндекс Object Storage.

---

## 5. SSL-сертификат (Let's Encrypt)

### 5.1 Запросить сертификат

```bash
yc certificate-manager certificate request \
  --name your-domain-cert \
  --domains your-domain.ru \
  --challenge dns
```

Сохранить ID сертификата из вывода.

### 5.2 Получить challenge-записи

```bash
yc certificate-manager certificate get --full --id <CERT_ID> --format yaml
```

В выводе будут `dns_challenge` → CNAME и TXT записи.

### 5.3 Добавить CNAME в DNS-зону

```bash
# ✅ Использовать CNAME (самый простой способ)
# Яндекс сам проксирует TXT через cm.yandexcloud.net
yc dns zone add-records --name your-domain-zone \
  --record "_acme-challenge 600 CNAME <CERT_ID>.cm.yandexcloud.net."
```

> ⚠️ CNAME и TXT не могут существовать на одном имени. Используйте что-то одно.

### 5.4 Привязать сертификат к бакету

```bash
yc storage bucket set-https \
  --name your-domain.ru \
  --certificate-id <CERT_ID>
```

После этого HTTPS на сайте заработает.

### 5.5 Проверить статус

```bash
yc certificate-manager certificate get --id <CERT_ID> --format yaml | grep -E "status:|not_after"
```

Статус `ISSUED` — сертификат активен.

---

## 6. Подключение домена

### 6.1 DNS-зона

```bash
yc dns zone create \
  --name your-domain-zone \
  --zone your-domain.ru. \
  --public-visibility
```

### 6.2 Делегирование домена

Узнать NS-серверы Яндекса:

```bash
yc dns zone list-records --name your-domain-zone | grep NS
```

Перейти к **регистратору домена** (reg.ru и т.п.) и сменить NS-серверы:

```
ns1.yandexcloud.net
ns2.yandexcloud.net
```

Проверить делегирование:

```bash
dig +short NS your-domain.ru @8.8.8.8
# Должно показать: ns1.yandexcloud.net. ns2.yandexcloud.net.

whois your-domain.ru | grep nserver
# Должно показать: ns1.yandexcloud.net. ns2.yandexcloud.net.
```

> ⚠️ После смены NS у регистратора — пропагация до 24 часов. Может откатиться, если не сохранить изменения. Проверяйте через whois.

---

## 7. DNS-записи

```bash
# ANAME — корень домена на бакет
yc dns zone add-records \
  --name your-domain-zone \
  --record "@ 600 ANAME your-domain.ru.website.yandexcloud.net"

# CNAME — www на корень
yc dns zone add-records \
  --name your-domain-zone \
  --record "www 600 CNAME your-domain.ru."
```

> Формат DNS-записей: `<NAME> [TTL] <TYPE> <DATA>` — всё одной строкой.

---

## Чек-лист проверки

```bash
# DNS
dig +short NS your-domain.ru @8.8.8.8
dig +short A your-domain.ru @8.8.8.8

# HTTP (должен быть 301 → HTTPS)
curl -sI http://your-domain.ru | head -3

# HTTPS
curl -sI https://your-domain.ru | head -5

# 404 страница
curl -sI https://your-domain.ru/nonexistent | head -3

# MIME-типы
curl -s https://your-domain.ru/_next/static/css/....css | head -1

# sitemap
curl -s https://your-domain.ru/sitemap.xml | head -5

# robots.txt
curl -s https://your-domain.ru/robots.txt
```

---

## Известные проблемы и их решения

| Проблема | Решение |
|---|---|
| `--public-read` не сработал при создании бакета | Включить отдельно: `yc storage bucket update --name ... --public-read --public-list` |
| 404.html не отображается | Next.js генерирует `out/404/index.html`, скопировать в `out/404.html` |
| CNAME + TXT конфликтуют на `_acme-challenge` | Использовать только CNAME → `cm.yandexcloud.net` |
| Сертификат долго в статусе `VALIDATING` | Проверить CNAME через `dig @8.8.8.8`, ждать до 30 мин |
| DNS не обновляется локально | Сменить DNS на `8.8.8.8` в настройках сети или ждать |
| CNAME www не работает | Использовать формат `"www 600 CNAME your-domain.ru."` с точкой |
| aws s3 sync выдаёт SignatureDoesNotMatch | Проверить ключи в `.env`, экспортнуть через `set -a; source .env; set +a` |

---

## Полезные ссылки

- [Документация Yandex Cloud CLI](https://cloud.yandex.ru/docs/cli/)
- [Статический хостинг на Object Storage](https://cloud.yandex.ru/docs/storage/operations/hosting/setup)
- [Сертификаты от Let's Encrypt](https://cloud.yandex.ru/docs/certificate-manager/operations/managed/cert-create)
- [DNS-зоны](https://cloud.yandex.ru/docs/dns/operations/zone-create)
- [AWS CLI S3 sync](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/s3/sync.html)
