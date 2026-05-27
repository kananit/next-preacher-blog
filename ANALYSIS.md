# Анализ репозитория preacher-blog

> Дата анализа: 28-05-2026

---

## 📋 Общая информация

| Параметр | Значение |
|---|---|
| **Название** | Blog Nextjs (Konspekt) |
| **Базовый шаблон** | next-tailwind-boilerplate от themefisher.com |
| **Деплой** | Netlify → `preacher-blog.netlify.app` |
| **Next.js** | 13.5.11 |
| **React** | 18.2.0 |
| **Стилизация** | Tailwind CSS 3 + SCSS |
| **Язык** | Русский |
| **Назначение** | Блог с AI-конспектами проповедей с YouTube |

---

## 🏗 Архитектура проекта

```
preacher-blog/
├── config/              # Конфигурация (сайт, меню, цвета, соцсети)
├── content/             # Markdown-контент (страницы + посты)
│   └── posts/           #   32 поста (post-001.md — post-032.md)
├── context/             # React Context (JSON-данные для поиска)
├── hooks/               # Пользовательские хуки
├── layouts/             # Компоненты отображения
│   ├── components/      #   Переиспользуемые UI-компоненты
│   ├── partials/        #   Части страниц (Header, Footer, Sidebar)
│   └── shortcodes/      #   MDX-компоненты (Accordion, Tabs, Video и др.)
├── lib/                 # Утилиты и парсеры
│   └── utils/           #   Вспомогательные функции
├── pages/               # Next.js страницы и маршруты
│   ├── categories/      #   Страницы категорий
│   ├── page/            #   Пагинация
│   └── posts/           #   Список и детальная поста
├── public/              # Статика (изображения, robots.txt)
│   └── images/          #   Изображения
├── scripts/             # (пусто)
└── styles/              # SCSS-стили
```

---

## 🧩 Структура страниц (Next.js Pages Router)

| Маршрут | Файл | Описание |
|---|---|---|
| `/` | `pages/index.js` | Главная — баннер, популярные записи, свежие записи, пагинация, сайдбар |
| `/[regular]` | `pages/[regular].js` | Динамические страницы (about, contact, 404, элементы) |
| `/posts/[single]` | `pages/posts/[single].js` | Детальная страница поста проповеди |
| `/posts/` | `pages/posts/index.js` | Страница со всеми постами |
| `/categories/` | `pages/categories/index.js` | Все категории |
| `/categories/[category]` | `pages/categories/[category].js` | Посты по категории |
| `/search` | `pages/search.js` | Поиск |
| `/page/[slug]` | `pages/page/[slug].js` | Пагинация на странице постов |

---

## 📝 Система контента

- **Формат**: Markdown + MDX (через `next-mdx-remote`)
- **Парсинг**: `gray-matter` для frontmatter
- **Хранение**: файловая система (`content/posts/`)

**Всего постов**: 32 (`post-001.md` — `post-032.md`)

### Структура frontmatter поста

```yaml
---
title: "..."
description: "..."
date: dd-MM-yyyy
categories: ["категория1", "категория2"]
featured: false
draft: false
---
```

### Статические страницы

| Файл | Назначение |
|---|---|
| `content/_index.md` | Главная (баннер, настройки секций) |
| `content/about.md` | О проекте |
| `content/contact.md` | Контакты |
| `content/404.md` | Страница 404 |
| `content/elements.md` | Демо-страница UI-элементов |

---

## 🎨 Тема и стилизация

- **Тёмная/светлая тема**: `next-themes` (системная по умолчанию)
- **Цветовая палитра**: настраивается в `config/theme.json`
  - Primary (светлая): `#2ba283` (teal)
  - Primary (тёмная): `#059669` (emerald)
- **Шрифты**: Nunito (Google Fonts, загружаются динамически)
- **Генерация обложек**: встроенный компонент `GeneratedCover` — 4 цвета палитры (teal, blue, violet, crimson) на основе категорий

### SCSS-архитектура

```
styles/
├── base.scss              # Базовые стили
├── buttons.scss           # Кнопки
├── components.scss        # Компоненты
├── generated-cover.scss   # Обложки постов
├── navigation.scss        # Навигация
├── style.scss             # Главный файл (импортирует всё)
└── utilities.scss         # Утилиты
```

---

## ⚙️ Конфигурация

### `config/config.json` — Основные настройки

- **Название сайта**: "Konspekt"
- **Пагинация**: 6 постов на страницу
- **Длина краткого описания**: 200 символов
- **Каталог блога**: `posts`
- **Переключатель темы**: включён
- **Disqus**: выключен
- **Виджеты**: about + featured_posts + categories включены, newsletter выключен

### `config/menu.json` — Навигация

- Главное меню: Конспекты, Категории, Инфо
- Футер: те же пункты

### `config/theme.json` — Тема

- Цвета для светлой и тёмной темы
- Настройки шрифтов и размера

### `config/social.json` — Социальные сети

- Ссылки на соцсети для отображения в хедере

---

## 🔧 Утилиты (`lib/`)

| Файл | Назначение |
|---|---|
| `contentParser.js` | Парсинг Markdown-файлов, получение страниц и постов |
| `taxonomyParser.js` | Извлечение категорий из frontmatter |
| `jsonGenerator.js` | Генерация `.json/posts.json` для поиска (запускается при `dev`/`build`) |
| `utils/dateFormat.js` | Форматирование дат |
| `utils/mdxParser.js` | Парсинг MDX в JSX |
| `utils/parseDate.js` | Валидация дат (проверка опубликован ли пост) |
| `utils/readingTime.js` | Время чтения поста |
| `utils/similarItems.js` | Похожие посты |
| `utils/sortFunctions.js` | Сортировка по дате |
| `utils/textConverter.js` | Преобразование текста (markdownify, slugify, plainify) |

---

## 🧩 Layouts и компоненты

### Основные шаблоны (`layouts/`)

- **Baseof.js** — базовый шаблон (Head, Header, main, Footer)
- **Default.js** — стандартная страница
- **PostSingle.js** — детальная страница поста
- **404.js** — страница 404
- **About.js** — страница "О проекте"
- **Contact.js** — страница контактов

### Shortcodes (MDX-компоненты)

`Accordion`, `Button`, `Code`, `Notice`, `Tab`, `Tabs`, `Video`

### Переиспользуемые компоненты (`layouts/components/`)

`GeneratedCover`, `ImageFallback`, `InnerPagination`, `Logo`, `NewsLetterForm`, `Pagination`, `Share`, `Social`, `ThemeSwitcher`, `TwSizeIndicator`

### Партиалы (`layouts/partials/`)

`Footer.js`, `Header.js`, `Post.js`, `SearchModal.js`, `Sidebar.js`

---

## 🚀 Скрипты и сборка

```json
{
  "dev": "node lib/jsonGenerator.js && next dev",
  "build": "node lib/jsonGenerator.js && next build",
  "lint": "next lint",
  "start": "next start"
}
```

- **Деплой**: Netlify (`netlify.toml`)
- **Перед каждым dev/build** запускается `jsonGenerator.js` — генерирует JSON-файл со всеми постами для клиентского поиска

---

## 🔍 Поиск

- Реализован через `SearchModal` (в хедере)
- Данные для поиска берутся из `.json/posts.json`, который генерируется на этапе сборки
- Контекст (`context/state.js`) провайдит JSON-данные через React Context

---

## 📦 Ключевые зависимости

### Production

| Пакет | Версия | Назначение |
|---|---|---|
| `next` | 13.5.11 | Фреймворк |
| `react` / `react-dom` | 18.2.0 | UI-библиотека |
| `next-mdx-remote` | ^4.3.0 | MDX-рендеринг |
| `gray-matter` | ^4.0.3 | Парсинг frontmatter |
| `marked` | ^4.2.12 | Markdown → HTML |
| `next-themes` | ^0.2.1 | Тёмная/светлая тема |
| `react-icons` | ^4.7.1 | Иконки |
| `disqus-react` | ^1.1.5 | Комментарии (выключены) |
| `react-lite-youtube-embed` | ^2.5.1 | Встраивание YouTube |
| `react-syntax-highlighter` | ^15.5.0 | Подсветка кода |
| `react-mailchimp-subscribe` | ^2.1.3 | Подписка (выключена) |
| `rehype-slug` | ^5.1.0 | Якоря для заголовков |
| `remark-gfm` | ^3.0.1 | GitHub Flavored Markdown |
| `github-slugger` | ^2.0.0 | Генерация slug |
| `react-gtm-module` | ^2.0.11 | Google Tag Manager |

### Dev

| Пакет | Назначение |
|---|---|
| `tailwindcss` + плагины | Стилизация |
| `sass` | SCSS-компиляция |
| `sharp` | Оптимизация изображений |
| `date-fns` / `date-fns-tz` | Работа с датами |
| `eslint` + `eslint-config-next` | Линтинг |
| `prettier` + `prettier-plugin-tailwindcss` | Форматирование |

---

## ✅ Сильные стороны проекта

1. **Высокая производительность** — Page Speed 100/100 Desktop
2. **Чистая архитектура** — разделение на конфиг, контент, шаблоны и утилиты
3. **MDX-компоненты** — расширяемость контента кастомными блоками
4. **Тёмная тема** — из коробки через `next-themes`
5. **SEO** — полный набор мета-тегов, Open Graph, canonical
6. **Генерация обложек** — автоматическая цветная обложка для каждого поста на основе категории
7. **Похожие посты** — рекомендации на основе совпадения категорий
8. **Поиск** — клиентский полнотекстовый поиск по всем постам
9. **Категории** — таксономия с фильтрацией

---

## 🔧 Потенциальные улучшения

1. **Обновить зависимости** — Next.js 13.5.11 (доступны 14/15), многие пакеты от 2022-2023
2. **Скрипты не используются** — папка `scripts/` пуста
3. **Disqus и Newsletter отключены** — возможно, планировались, но не используются
4. **Контент нумерованный** — посты `post-001` — `post-032`, выглядят как массово импортированные
5. **`.json/` в `.gitignore`** — JSON для поиска не коммитится (генерируется при сборке)

---

## 📊 Итог

Полнофункциональный **русскоязычный блог на Next.js 13** для публикации AI-конспектов проповедей. Используется boilerplate от themefisher.com, кастомизированный под русский контент с уникальной цветовой палитрой. Архитектура чистая, код хорошо структурирован, есть всё необходимое для ведения блога: категории, поиск, пагинация, похожие посты, тёмная тема, SEO — интеграция с Netlify для деплоя.
