/**
 * Highlights occurrences of `keyword` in `text` by wrapping them in <mark> tags.
 * Matching is case-insensitive; the original case of the text is preserved.
 */
export const highlightText = (text, keyword) => {
  if (!keyword || !text) return text;

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part && part.toLowerCase() === keyword.toLowerCase()) {
      return (
        <mark key={i} className="rounded bg-primary/20 px-0.5 text-inherit">
          {part}
        </mark>
      );
    }
    return part;
  });
};
