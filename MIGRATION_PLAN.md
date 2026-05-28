# План миграции preacher-blog на Яндекс Cloud

> План переноса статического сайта с Netlify на Яндекс Cloud + обновление зависимостей проекта
> Основан на статье: [habr.com/ru/articles/1011050](https://habr.com/ru/articles/1011050)

---

## Содержание

1. [Обоснование](#1-обоснование)
2. [Обновление зависимостей](#2-обновление-зависимостей)
3. [Настройка статического экспорта](#3-настройка-статического-экспорта)
4. [Инфраструктура Яндекс Cloud](#4-инфраструктура-яндекс-cloud)
5. [Деплой-скрипт](#5-деплой-скрипт)
6. [Аналитика — Яндекс Метрика](#6-аналитика--яндекс-метрика)
7. [SEO — Яндекс Вебмастер](#7-seo--яндекс-вебмастер)
8. [DNS и запуск](#8-dns-и-запуск)

---

## 1. Обоснование

### Текущее состояние

| Параметр | Сейчас |
|---|---|
| **Хостинг** | Netlify (`preacher-blog.netlify.app`) |
| **CDN** | Зарубежный — возможны блокировки и нестабильность из РФ |
| **Аналитика** | Google Tag Manager (не настроен, `tag_manager_id` пустой) |
| **SEO для Яндекса** | Отсутствует |
| **Стоимость** | $0 (free tier) |

### Целевое состояние

| Параметр | После миграции |
|---|---|
| **Хостинг** | Яндекс Cloud Object Storage |
| **CDN** | Яндекс.РФ — стабильный доступ из России |
| **Аналитика** | Яндекс Метрика (бесплатно + вебвизор, карты кликов) |
| **SEO для Яндекса** | Яндекс Вебмастер (бесплатно) |
| **Стоимость** | 0 ₽/мес (free tier) |
| **Домен** | 800-1200 ₽/год |

---

## 2. Обновление зависимостей

> ⚠️ **Важно:** после обновлений запустить `npm install` и проверить, что проект собирается без ошибок.
> В случае проблем с `yarn.lock` — удалить его и перегенерировать через `yarn install`.

### 2.1 Production-зависимости

| Пакет | Текущая версия | Новая версия | Изменения |
|---|---|---|---|
| `next` | `13.5.11` | `^15.5.18` | **Major** — Next.js 13 → 15. Pages Router всё ещё поддерживается. `next export` заменён на `output: "export"` в `next.config.js` |
| `react` | `18.2.0` | `^18.2.0` | Без изменений (совместимо с Next.js 15) |
| `react-dom` | `18.2.0` | `^18.2.0` | Без изменений |
| `next-mdx-remote` | `^4.3.0` | `^6.0.0` | **Major** — проверить API компонентов |
| `next-themes` | `^0.2.1` | `^0.4.6` | **Major** — проверить API провайдера |
| `marked` | `^4.2.12` | `^18.0.4` | **Major** — значительные изменения API (асинхронный парсинг) |
| `rehype-slug` | `^5.1.0` | `^6.0.0` | **Major** — проверить совместимость |
| `remark-gfm` | `^3.0.1` | `^4.0.1` | **Major** |
| `react-icons` | `^4.7.1` | `^5.6.0` | **Major** — некоторые иконки могли быть переименованы |
| `react-lite-youtube-embed` | `^2.5.1` | `^3.5.1` | **Major** |
| `react-syntax-highlighter` | `^15.5.0` | `^16.1.1` | **Major** |
| `disqus-react` | `^1.1.5` | `^1.1.7` | Patch |
| `github-slugger` | `^2.0.0` | `^2.0.0` | Без изменений |
| `gray-matter` | `^4.0.3` | `^4.0.3` | Без изменений |
| `react-gtm-module` | `^2.0.11` | `^2.0.11` | Без изменений |
| `react-mailchimp-subscribe` | `^2.1.3` | `^2.1.3` | Без изменений |

### 2.2 Dev-зависимости

| Пакет | Текущая версия | Новая версия | Изменения |
|---|---|---|---|
| `tailwindcss` | `^3.2.4` | `^3.4.19` | Последняя v3 (v4 — breaking-изменения, миграция позже) |
| `@tailwindcss/typography` | `^0.5.9` | `^0.5.19` | patch/minor |
| `@tailwindcss/forms` | `^0.5.3` | `^0.5.11` | patch/minor |
| `tailwind-scrollbar` | `^2.1.0` | `^4.0.2` | **Major** |
| `postcss` | `^8.4.21` | `^8.5.15` | minor/patch |
| `autoprefixer` | `^10.4.13` | `^10.5.0` | minor |
| `sass` | `^1.57.1` | `^1.100.0` | **Major** |
| `sharp` | `^0.31.3` | `^0.34.5` | minor |
| `date-fns` | `^2.29.3` | `^4.3.0` | **Major** |
| `date-fns-tz` | `^1.3.7` | `^3.2.0` | **Major** |
| `eslint` | `8.32.0` | `^9.24.0` | **Major** — новая конфигурация (flat config) |
| `eslint-config-next` | `13.1.5` | `^15.5.18` | **Major** |
| `prettier` | `^2.8.3` | `^3.8.3` | **Major** |
| `prettier-plugin-tailwindcss` | `^0.2.2` | `^0.8.0` | **Major** |
| `jshint` | `^2.13.6` | `^2.13.6` | Оставить |

> ⚠️ **Рекомендация:** выполнять обновление поэтапно с проверкой `npm run build` после каждого шага.

#### Порядок обновления (безопасный):

```
Шаг 1: patch/minor-обновления (tailwindcss v3, postcss, autoprefixer, disqus-react)
Шаг 2: tailwind-scrollbar, react-icons
Шаг 3: sass, sharp
Шаг 4: date-fns, date-fns-tz
Шаг 5: prettier, prettier-plugin-tailwindcss
Шаг 6: next, react, next-mdx-remote, next-themes
Шаг 7: rehype-slug, remark-gfm
Шаг 8: marked, react-syntax-highlighter
Шаг 9: eslint, eslint-config-next
Шаг 10: проверка сборки и деплой
```

### 2.3 Обновление `next.config.js`

После обновления Next.js до 15.х заменить `next export` на встроенный механизм:

```js
/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  output: "export",              // <-- вместо next export
  trailingSlash: true,           // <-- чтобы ссылки работали с Object Storage
  images: {
    unoptimized: true,           // <-- отключаем оптимизацию next/image (нет сервера)
  },
};

module.exports = nextConfig;
```

### 2.4 Обновление `package.json` (scripts)

Заменить скрипт `export`, т.к. `next export` удалён из CLI:

```json
{
  "scripts": {
    "dev": "node lib/jsonGenerator.js && next dev",
    "build": "node lib/jsonGenerator.js && next build",
    "export": "npm run build",           // build сам генерирует out/ при output: "export"
    "lint": "next lint",
    "start": "npx serve out"             // вместо next start (для локальной проверки статики)
  }
}
```

---

## 3. Настройка статического экспорта

### 3.1 Проверка проблемных мест

Перед миграцией убедиться, что сайт работает как статика:

| Компонент | Статус | Действие |
|---|---|---|
| `getStaticProps` / `getStaticPaths` | ✅ Уже используется | Оставить как есть |
| `next/image` | ✅ Используется `ImageFallback` | Проверить, что работает с `unoptimized: true` |
| `next-mdx-remote` | ✅ Должен работать | Проверить при сборке |
| `jsonGenerator.js` | ✅ Запускается на этапе сборки | Работает |
| `react-mailchimp-subscribe` | ⚠️ Отключён | Оставить выключенным |
| `disqus-react` | ⚠️ Отключён | Оставить выключенным |
| `react-gtm-module` | ⚠️ ID пустой | Оставить или заменить на Яндекс Метрику |

### 3.2 Проверка сборки

```bash
# 1. Собрать статику
npm run build

# 2. Проверить, что появилась папка out/
ls -la out/

# 3. Запустить локально
npx serve out/

# 4. Открыть http://localhost:3000 и проверить:
#    - Все страницы открываются
#    - CSS грузится
#    - Изображения отображаются
#    - Навигация работает
#    - Поиск работает
```

---

## 4. Инфраструктура Яндекс Cloud

### 4.1 Необходимые сервисы

| Сервис | Назначение | Free Tier |
|---|---|---|
| **Object Storage** | Хранение файлов сайта | 1 ГБ бесплатно |
| **DNS** | DNS-зона для домена | Бесплатно |
| **Certificate Manager** | Let's Encrypt SSL-сертификат | Бесплатно |
| **IAM** | Сервис-аккаунт для деплоя | Бесплатно |

### 4.2 Установка и настройка YC CLI

```bash
# Установка
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash

# Инициализация (потребуется OAuth-токен из https://oauth.yandex.ru/)
yc init
```

### 4.3 Создание бакета

```bash
# Создать бакет (имя = домену сайта) + публичный доступ
# Флаги --public-read и --public-list задаются при создании
yc storage bucket create \
  --name hosea.ru \
  --default-storage-class standard \
  --max-size 1073741824 \
  --public-read \
  --public-list

# Включить статический хостинг
yc storage bucket update \
  --name hosea.ru \
  --website-settings '{
    "index": "index.html",
    "error": "404.html"
  }'
```

### 4.4 Настройка DNS

```bash
# Создать DNS-зону
yc dns zone create \
  --name hosea-ru \
  --zone hosea.ru. \
  --public-visibility

# ANAME-запись на бакет (используем .website.yandexcloud.net, а не .storage.yandexcloud.net)
yc dns zone add-records \
  --name hosea-ru \
  --record "@ 600 ANAME hosea.ru.website.yandexcloud.net"

# www → основной домен (всё одной строкой: <NAME> [TTL] <TYPE> <DATA>)
yc dns zone add-records \
  --name hosea-ru \
  --record "www 600 CNAME hosea.ru."
```

> После создания DNS-зоны нужно перенести NS-серверы на Яндексе в панели reg.ru (или другого регистратора). DNS-пропагация занимает ~6 часов.

### 4.5 SSL-сертификат (Let's Encrypt)

```bash
# Заказать сертификат
yc certificate-manager certificate request \
  --name hosea-cert \
  --domains hosea.ru \
  --challenge dns

# Получить id сертификата
yc certificate-manager certificate list

# Проверить статус (должен быть "validated" после настройки DNS)
yc certificate-manager certificate get \
  --id <CERTIFICATE_ID>
```

### 4.6 Сервис-аккаунт для деплоя

```bash
# Создать сервисный аккаунт
yc iam service-account create \
  --name hosea-deployer

# Назначить роль storage.editor
# Формат: yc resource-manager folder add-access-binding <FOLDER_ID> \
#   --role storage.editor \
#   --subject serviceAccount:<SA_ID>
yc resource-manager folder list  # узнать FOLDER_ID
yc resource-manager folder add-access-binding <FOLDER_ID> \
  --role storage.editor \
  --subject serviceAccount:<SA_ID>

# Создать статические ключи (для деплой-скрипта)
yc iam access-key create \
  --service-account-id <SA_ID>
# → Сохранить key_id и secret в .env
```

---

## 5. Деплой-скрипт

### 5.1 Скрипт deploy.sh

> ⚠️ **Важно:** Яндекс Object Storage **не определяет MIME-типы автоматически**. Без явного `--content-type` CSS и JS будут отдаваться как `application/octet-stream`, и сайт развалится.

Создать `scripts/deploy.sh`:

```bash
#!/bin/bash
set -euo pipefail

BUCKET="hosea.ru"
BUILD_DIR="out"

# Цвета для вывода
GREEN='\033[0;32m'
NC='\033[0m'

echo "🔨 Сборка статики..."
npm run build

# Счётчик для статистики
TOTAL=0

upload() {
  local src="$1"
  local dst="$2"
  local content_type="$3"

  yc storage s3 cp "$src" "s3://${BUCKET}/${dst}" \
    --content-type "$content_type" --quiet
  TOTAL=$((TOTAL + 1))
}

echo "📦 Загрузка файлов в Object Storage..."

# Обход всех файлов в out/
find "$BUILD_DIR" -type f | while read -r file; do
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
    *)       upload "$file" "$rel" "application/octet-stream" ;;
  esac
done

echo "✅ Готово! Загружено ${TOTAL} файлов."
```

### 5.2 Добавление в package.json

```json
{
  "scripts": {
    "deploy": "bash scripts/deploy.sh",
    "deploy:dry": "bash scripts/deploy.sh --dry-run"
  }
}
```

### 5.3 Создание .env для ключей доступа

Создать `.env` (не коммитить!):

```
AWS_ACCESS_KEY_ID=<key_id>
AWS_SECRET_ACCESS_KEY=<secret>
```

---

## 6. Аналитика — Яндекс Метрика

### 6.1 Регистрация счётчика

1. Зайти в [metrika.yandex.ru](https://metrika.yandex.ru)
2. Создать счётчик для `hosea.ru`
3. Получить ID счётчика (например, `12345678`)
4. Выбрать: вебвизор, тепловые карты, точный расчёт отказов

### 6.2 Компонент для Next.js

Создать `layouts/components/YandexMetrika.js`:

```jsx
"use client";

import Script from "next/script";

const YandexMetrika = ({ counterId }) => {
  if (!counterId) return null;

  return (
    <Script id="yandex-metrika" strategy="afterInteractive">
      {`
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){
          (m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          k=e.createElement(t);a=e.getElementsByTagName(t)[0];
          k.async=1;k.src=r;a.parentNode.insertBefore(k,a)
        })(window,document,"script",
           "https://mc.yandex.ru/metrika/tag.js","ym");

        ym(${counterId},"init",{
          webvisor: true,
          clickmap: true,
          accurateTrackBounce: true,
          trackLinks: true
        });
      `}
    </Script>
  );
};

export default YandexMetrika;
```

### 6.3 Подключение в _app.js

В `pages/_app.js` добавить:

```jsx
import YandexMetrika from "@layouts/components/YandexMetrika";

// Внутри компонента App:
return (
  <JsonContext>
    <Head>
      {/* ... существующие мета-теги ... */}
    </Head>
    <YandexMetrika counterId={config.params.yandex_metrika_id} />
    <ThemeProvider ... >
      <Component {...pageProps} />
    </ThemeProvider>
  </JsonContext>
);
```

### 6.4 Добавление ID счётчика в config.json

В `config/config.json` добавить:

```json
{
  "params": {
    "yandex_metrika_id": "ВАШ_НОМЕР_СЧЁТЧИКА",
    "tag_manager_id": "",
    "footer_content": "...",
    "copyright": "2024"
  }
}
```

---

## 7. SEO — Яндекс Вебмастер

### 7.1 Добавление сайта

1. Зайти в [webmaster.yandex.ru](https://webmaster.yandex.ru)
2. Добавить сайт `hosea.ru`
3. Подтвердить права через:
   - **DNS-запись** — самый простой способ добавить TXT-запись в DNS-зону Яндекса
   - Или через **мета-тег** в `Baseof.js`

### 7.2 Отправка sitemap.xml

Next.js с `output: "export"` автоматически генерирует:
- `out/sitemap.xml`
- `out/robots.txt`

В Вебмастере указать путь: `https://hosea.ru/sitemap.xml`

(Опционально) Отправка через API:

```bash
# Получить OAuth-токен (можно использовать тот же, что для Метрики)
YM_TOKEN="..."

# Получить user_id
USER_ID=$(curl -s \
  -H "Authorization: OAuth $YM_TOKEN" \
  "https://api.webmaster.yandex.net/v4/user" | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['user_id'])")

# Отправить sitemap
curl -s -X POST \
  -H "Authorization: OAuth $YM_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.webmaster.yandex.net/v4/user/${USER_ID}/hosts/https:hosea.ru:443/user-added-sitemaps" \
  -d '{"url": "https://hosea.ru/sitemap.xml"}'
```

### 7.3 Добавление мета-тега вебмастера (опционально)

В `layouts/Baseof.js`, в блок `<Head>`, добавить:

```jsx
{config.params.yandex_verification && (
  <meta name="yandex-verification" content={config.params.yandex_verification} />
)}
```

В `config/config.json`:

```json
{
  "params": {
    "yandex_metrika_id": "ВАШ_НОМЕР_СЧЁТЧИКА",
    "yandex_verification": "КОД_ПОДТВЕРЖДЕНИЯ",
    "tag_manager_id": ""
  }
}
```

---

## 8. DNS и запуск

### 8.1 Чек-лист перед переключением

- [ ] `npm run build` — собирается без ошибок
- [ ] `npx serve out/` — сайт работает локально
- [ ] Все страницы открываются, ссылки рабочие
- [ ] Изображения отображаются
- [ ] Поиск работает
- [ ] Яндекс Метрика добавлена и проверена
- [ ] `scripts/deploy.sh` загружает файлы в бакет
- [ ] SSL-сертификат получен (статус `validated`)
- [ ] В DNS-зоне есть все необходимые записи

### 8.2 Переключение DNS

1. В панели reg.ru (или другого регистратора) заменить NS-серверы:

   ```
   dns1.yandexcloud.net
   dns2.yandexcloud.net
   ```

2. Подождать ~6 часов (DNS-пропагация)
3. Проверить: `https://hosea.ru` открывается с SSL

### 8.3 Финальный тест

```bash
# Проверить HTTP-заголовки
curl -I https://hosea.ru

# Проверить MIME-типы CSS
curl -s https://hosea.ru/_next/static/css/...css | head -1

# Проверить sitemap
curl -s https://hosea.ru/sitemap.xml | head -5

# Проверить robots.txt
curl -s https://hosea.ru/robots.txt
```

### 8.4 После миграции

- [ ] Обновить `README.md` — указать новый URL (или оставить, если домен тот же)
- [ ] Удалить/закомментировать старый `netlify.toml`
- [ ] Настроить деплой через GitHub Actions (опционально)
- [ ] Настроить уведомления в Вебмастере об ошибках индексации
- [ ] Проверить Яндекс Метрику через 24 часа — есть ли визиты

---

## Приложение A: Сравнение Netlify vs Яндекс Cloud

| Критерий | Netlify | Яндекс Cloud |
|---|---|---|
| **Доступность из РФ** | ❌ Нестабильно | ✅ Стабильно |
| **Стоимость** | $0 (free tier) | 0 ₽ (free tier) |
| **SSL** | Автоматический | Let's Encrypt (автообновление) |
| **Деплой** | `git push` | `bash deploy.sh` |
| **Preview по PR** | ✅ Есть | ❌ Нет |
| **CDN** | Global | Россия + СНГ |
| **Serverless** | Netlify Functions | Cloud Functions (1М вызовов/мес) |
| **Аналитика** | ❌ (не настроена) | Яндекс Метрика (бесплатно) |
| **SEO для Яндекса** | ❌ | Яндекс Вебмастер |

## Приложение B: Стоимость Яндекс Cloud (free tier)

| Ресурс | Бесплатный лимит | Прогноз для preacher-blog |
|---|---|---|
| **Object Storage** | 1 ГБ | ~15-20 МБ (даже не близко к лимиту) |
| **Cloud Functions** | 1 млн вызовов/мес | Не используются |
| **DNS** | Бесплатно | Бесплатно |
| **Certificate Manager** | Бесплатно (Let's Encrypt) | Бесплатно |
| **Итого** | **0 ₽/мес** | **0 ₽/мес** |

---

## Приложение C: Полезные ссылки

- [Статья на Хабре — оригинал](https://habr.com/ru/articles/1011050/)
- [Яндекс Object Storage — документация](https://yandex.cloud/ru/docs/storage/)
- [Яндекс DNS — документация](https://yandex.cloud/ru/docs/dns/)
- [Яндекс Certificate Manager](https://yandex.cloud/ru/docs/certificate-manager/)
- [Яндекс Метрика](https://metrika.yandex.ru/)
- [Яндекс Вебмастер](https://webmaster.yandex.ru/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Tailwind CSS v3 — установка](https://v3.tailwindcss.com/docs/installation)
