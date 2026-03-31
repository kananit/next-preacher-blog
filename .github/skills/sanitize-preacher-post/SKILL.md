---
name: sanitize-preacher-post
description: "Normalize preacher blog markdown posts. Use for aligning posts to a reference structure, adding descriptions, removing intro headings, and numbering headings when the title contains a number. Do not add horizontal rules in post content."
argument-hint: "Reference post and target post files or range to normalize"
user-invocable: true
---

# Sanitize Preacher Post

## When to Use

- Normalize sermon or teaching posts in `content/posts/*.md`
- Align multiple posts to one reference article structure
- Add or refine `description` in front matter
- Remove intro headings while keeping intro text
- Number section headings when the post title contains a number
- Keep post content free of horizontal rules such as `---`

## Scope Assumption

This skill is designed for this repository's preacher-blog content format and should be used on markdown posts with YAML front matter.

## Procedure

1. Identify the reference post.
   Use the user-provided example post as the structural source of truth. Read its front matter, intro style, heading depth, and ending structure.

2. Inspect the target posts before editing.
   Read each target file and compare:

- front matter fields
- intro formatting
- `##` and `###` heading patterns
- whether the title implies a numbered list
- whether unwanted horizontal rules are present in content

3. Normalize front matter.
   Ensure YAML front matter is valid and consistent.

- Preserve existing title, date, categories, featured, and draft unless correction is required
- Add `description` if missing
- Keep descriptions concise and discovery-friendly
- Fix obviously invalid metadata only when necessary, such as an impossible date

4. Normalize the intro.

- Keep the introduction as plain text directly after front matter
- Do not leave a `## Введение: ...` heading
- Preserve the meaning and wording of the intro unless the user explicitly asks for rewriting

5. Decide whether the post should use numbered headings.
   If the title contains a leading numeric idea such as `5`, `7`, `8`, `9`, or `10`, number the main content headings to match the title.

Use these rules:

- If the main list items are `##` headings, number those `##` headings
- If the list items are `###` headings under a framing `##` block, number the `###` headings
- Do not number the `## Вывод: ...` heading
- Do not introduce extra numbering where the article is not list-based

6. Do not add horizontal rules in post content.

- Never insert `---` as a visual separator inside the article body
- Preserve only the YAML front matter delimiters at the top of the file
- Rely on heading structure and existing SCSS styling for visual separation

7. Preserve content integrity.

- Do not rewrite theology, claims, or examples unless asked
- Do not compress or expand the article unnecessarily
- Prefer structural cleanup over editorial rewriting

8. Validate after editing.
   Check that:

- every edited file still has valid front matter
- intro text remains without a `## Введение` heading
- numbering matches the title when applicable
- no horizontal rules were added inside post content
- conclusion remains under `## Вывод: ...`

## Decision Rules

### Numbered title

Apply numbering when the title itself promises a count-based structure, for example:

- `7 типов...`
- `9 признаков...`
- `10 принципов...`
- `8 опасных мест...`

### Non-numbered title

If the title does not imply a numbered list, keep headings unnumbered and do not add visual separators in content.

### Mixed structure

If a post has a framing `##` section and the actual list lives in `###` subsections, number the `###` subsections instead of forcing the whole file into a different hierarchy.

## Completion Checks

- `description` exists in front matter
- no `## Введение:` heading remains
- numbered posts have coherent numbering
- no horizontal rules exist in post content
- no accidental formatting drift was introduced in unrelated parts of the file

## Example Prompts

- `/sanitize-preacher-post use post-22 as the reference and normalize posts 10-23`
- `/sanitize-preacher-post align this post to the preacher-blog structure and add missing description`
- `/sanitize-preacher-post remove intro headings, fix numbering, and keep the post free of content separators`
