#!/usr/bin/env python3
"""Mechanical checks for notes/posts: frontmatter, title, CAPS, refs, formatting.

Usage: python3 scripts/check-note.py content/notes/.../NNN-Title.md [...]
Exit code 1 if any ERROR, 0 otherwise.
"""

import pathlib
import re
import sys

ALLOWED_CAPS = {
    "ЕСМЬ", "ДНК", "РНК", "США", "СССР", "СНГ", "РФ", "СМИ", "НЛО",
    "ЦРУ", "ФБР", "ЕС", "ООН", "СПИД", "ВИЧ", "ИНН",
    "АА", "АН", "ПРЛ", "ДРИ", "СДВ", "СДВГ", "СРА", "СПЕ", "ДДК",
}
SERVICE_BLOCKS = (
    "Multiplying Freedom Ministries",
    "MultiplyingFreedom.com",
    "MultiplyingFreedom@gmail.com",
)
REQUIRED = ("title", "description", "date", "categories", "draft")


def check(path):
    errors, warnings = [], []
    text = path.read_text(encoding="utf-8")

    if not text.startswith("---\n"):
        return ["файл не начинается с ---"], warnings, ""
    prefix, sep, body = text.partition("\n---")
    if not sep:
        return ["frontmatter не закрыт"], warnings, ""
    body = body.split("\n", 1)[1] if "\n" in body else ""

    meta = {}
    for line in prefix.splitlines()[1:]:
        m = re.match(r"^([a-z_]+):\s*(.*)$", line)
        if m:
            meta[m.group(1)] = m.group(2).strip().strip('"')

    for key in REQUIRED:
        if key not in meta:
            errors.append(f"frontmatter: нет поля {key}")

    title = meta.get("title", "")
    if len(title) > 60:
        errors.append(f"title {len(title)} символов (максимум 60)")
    h2 = re.search(r"^## (.+)$", body, re.MULTILINE)
    if not h2:
        errors.append("нет заголовка ##")
    elif h2.group(1).strip() != title:
        errors.append("title не совпадает с первым ##")

    if not re.match(r"^\d{2}-\d{2}-\d{4}$", meta.get("date", "")):
        errors.append("date не в формате ДД-ММ-ГГГГ")

    if re.search(r"^---\s*$", body, re.MULTILINE):
        errors.append("в теле есть ---")
    if re.search(r"^#{2,3}.*\?\s*$", body, re.MULTILINE):
        errors.append("вопросительный знак в заголовке")
    if re.search(r"^\s*[-*]?\s*[а-я]\)", body, re.MULTILINE):
        errors.append("буквенный маркер списка (а) б))")
    if re.search(r"\b[1-3]\s(Кор|Тим|Ин|Пет|Фес|Цар|Пар)\.", body):
        errors.append("нумерованная книга без дефиса (1-Кор.)")
    if re.search(r"(\b[А-Яа-яЁё]{3,}\b)\s+\1\b", body):
        warnings.append("повтор слова")
    if "  " in body:
        warnings.append("двойные пробелы")
    if path.parent.name == "multiplying-freedom" and not re.match(
        r"^\d{3}-.+\.md$", path.name
    ):
        errors.append("имя файла не по шаблону NNN-Название.md")

    caps = sorted({w for w in re.findall(r"\b[А-ЯЁ]{2,}\b", body) if w not in ALLOWED_CAPS})
    if caps:
        errors.append("CAPS: " + ", ".join(caps))
    latin = sorted({w for w in re.findall(r"\b[A-Z]{3,}\b", body) if w not in {"PDF"}})
    if latin:
        warnings.append("латинский CAPS: " + ", ".join(latin))

    for block in SERVICE_BLOCKS:
        if block in body:
            errors.append(f"служебный блок: {block}")

    quotes = len(re.findall(r"^>", body, re.MULTILINE))
    return errors, warnings, f"цитат >: {quotes}"


def main():
    files = [pathlib.Path(arg) for arg in sys.argv[1:]]
    if not files:
        print("usage: check-note.py FILE [FILE...]")
        return 2
    failed = False
    for path in files:
        errors, warnings, info = check(path)
        print(f"{path}:")
        for error in errors:
            print(f"  ERROR {error}")
        for warning in warnings:
            print(f"  WARN  {warning}")
        if info:
            print(f"  INFO  {info}")
        if not errors:
            print("  OK")
        failed = failed or bool(errors)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
