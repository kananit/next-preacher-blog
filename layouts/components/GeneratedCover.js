import { getCoverPalette } from "@lib/utils/categoryPalette";

// Deterministic hash — used for stable fallback angle only
const hashString = (value = "") => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getCategoryGlyph = (category = "") => {
  const normalized = category.trim().toUpperCase();
  if (!normalized) {
    return "";
  }

  const parts = normalized
    .split(/[\s-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`;
  }

  return normalized.slice(0, 2);
};

const GeneratedCover = ({ post, className = "", mode = "full" }) => {
  const categories = post.frontmatter.categories || [];

  // First category sets the color palette
  const firstCat = (categories[0] || "").toLowerCase().trim();
  const palette = getCoverPalette(firstCat);

  const seed = `${post.slug || ""}-${post.frontmatter.title || ""}`;
  const hash = hashString(seed);
  const angle = 15 + (hash % 150);

  if (mode === "stripe-only") {
    return (
      <div
        className={`generated-cover generated-cover--stripe-only rounded ${className}`.trim()}
        style={{
          "--cover-c2": palette[1],
        }}
        aria-hidden="true"
      />
    );
  }

  // Glyph logic:
  // - If 2+ categories → show the second category (letters), first is color
  // - If only 1 category → show the first category (so cover isn't empty)
  const glyphCategory = categories.length >= 2 ? categories[1] : categories[0];
  const glyph = glyphCategory ? getCategoryGlyph(glyphCategory) : "";

  const layers = glyph
    ? [{ palette, glyph }]
    : [];

  return (
    <div
      className={`generated-cover rounded ${className}`.trim()}
      style={{
        "--cover-c1": palette[0],
        "--cover-c2": palette[1],
        "--cover-angle": `${angle}deg`,
      }}
      aria-hidden="true"
    >
      {layers.map((cfg) => (
        <span
          key={cfg.glyph}
          className="generated-cover__layer generated-cover__layer--primary"
          data-label={cfg.glyph}
          style={{
            "--layer-c4": cfg.palette[3],
            "--glyph-x": "50%",
            "--glyph-y": "50%",
            "--glyph-size": "clamp(7rem, 20vw, 14rem)",
            "--glyph-opacity": "0.64",
          }}
        />
      ))}
    </div>
  );
};

export default GeneratedCover;
