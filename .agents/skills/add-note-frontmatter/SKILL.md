---
name: add-note-frontmatter
description: >
  Добавляет YAML frontmatter (header) в файлы конспектов/заметок в
  content/notes/multiplying-freedom/, у которых отсутствует header.
  Извлекает заголовок из первого ##, формирует описание, проставляет
  стандартные поля (date, categories, source_url).
---

# Добавление frontmatter в заметки multiplying-freedom

Используй этот скил, когда нужно добавить YAML frontmatter (header) в `.md`-файлы внутри `content/notes/multiplying-freedom/`, у которых его нет.

## Признак отсутствия header

Файл **не начинается** с `---` на первой строке. Вместо этого он может начинаться, например, с `## Название`.

## Формат header

```yaml
---
title: "..."            # берётся из первого заголовка ## (без ##)
description: "..."      # краткое описание из контекста файла
date: DD-MM-YYYY        # текущая дата в формате ДД-ММ-ГГГГ
categories: ["статьи", "multiplying-freedom"]
featured: false
draft: false
source_url: "https://multiplyingfreedom.com/free-stuff/"
---
```

## Правила заполнения полей

### title
- Берётся из первого заголовка `##` в файле — сам заголовок без `##` и лишних пробелов.
- Заключается в двойные кавычки.
- Если заголовка нет — используй имя файла (без расширения `.md`, без ведущего номера `NNN-`).

### description
- Составляется на основе содержания файла (первые 1–2 предложения или суть темы).
- Должен быть осмысленным, — 1 предложение (20–200 символов).
- Заключается в двойные кавычки.
- Начинается со слова «Статья о ...» или «Молитва и ...» в зависимости от содержания.

### date
- Используй текущую дату (сегодняшнюю) в формате ДД-ММ-ГГГГ.
- **Проверь «Today's Date» в блоке System Information в начале разговора.** Дата указана как YYYY-MM-DD. Преобразуй её в ДД-ММ-ГГГГ.
- ⚠️ Если ты не уверен в дате или сомневаешься — **остановись и перепроверь** «Today's Date» в System Information. Не пиши дату «на глаз» и не бери из соседних файлов.
- Не копируй дату из соседних файлов.

### categories
- Если в содержании есть упоминание «шаг свободы» / «шаги к свободе» / номер шага — добавляй `"шаги к свободе"` в массив:
  ```yaml
  categories: ["статьи", "multiplying-freedom", "шаги к свободе"]
  ```
- Если это общая статья/учение без привязки к шагам — не добавляй «шаги к свободе»:
  ```yaml
  categories: ["статьи", "multiplying-freedom"]
  ```

### featured, draft
- Всегда `false`.

### source_url
- Всегда `https://multiplyingfreedom.com/free-stuff/`.

## Как добавлять header

Используй Python для вставки в начало файла, так как `edit_file` может падать на кириллице, а `sed` — на многострочных вставках:

```python
import os

filepath = 'content/notes/multiplying-freedom/ИМЯ-ФАЙЛА.md'
header = '''---
title: "НАЗВАНИЕ"
description: "ОПИСАНИЕ"
date: ДД-ММ-ГГГГ
categories: ["статьи", "multiplying-freedom"дополнительные]
featured: false
draft: false
source_url: "https://multiplyingfreedom.com/free-stuff/"
---

'''

with open(filepath, 'r') as f:
    content = f.read()

with open(filepath, 'w') as f:
    f.write(header + content)
```

## Проверка результата

После добавления прочитай первые 10 строк файла, чтобы убедиться, что header вставлен корректно.
