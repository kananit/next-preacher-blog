// Deterministic hash — used for stable fallback angle only
const hashString = (value = "") => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

// Only first categories determine color.
// palette: [c1 base-light, c2 base-dark, c3 overlay-light, c4 overlay-dark]
const FIRST_CATEGORY_MAP = {
  аш: ["#b8c8e0", "#2c4fa0", "#dae0f0", "#183a6e"],
  "олег мамонтов": ["#d4b8e0", "#7d2ca0", "#eadaf0", "#4e186e"],
  "владимир михайлов": ["#e8b8c8", "#a02c4f", "#f5e0e7", "#6e1832"],
};

const FALLBACK_PALETTE = ["#e8dfc2", "#8a7d51", "#f7f2df", "#6e633e"];

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
  const palette = FIRST_CATEGORY_MAP[firstCat] || FALLBACK_PALETTE;

  // Only additional categories add visual patterns
  const extraCategories = categories.slice(1);
  const showRightStripe = extraCategories.length > 1;
  const stripeLabel = showRightStripe
    ? (categories[2] || "").replace(/-/g, " ").toUpperCase()
    : "";

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

  // Additional categories get a clean overlay layer.
  const layers = extraCategories
    .map((category, index) => {
      const glyph = getCategoryGlyph(category);
      if (!glyph) {
        return null;
      }

      return {
        palette,
        glyph,
        isLetter: index === 0,
        accentType: index === 0 ? null : (index - 1) % 3,
      };
    })
    .filter((cfg) => Boolean(cfg.glyph));

  return (
    <div
      className={`generated-cover rounded ${className}`.trim()}
      data-stripe-label={stripeLabel || undefined}
      style={{
        "--cover-c1": palette[0],
        "--cover-c2": palette[1],
        "--cover-angle": `${angle}deg`,
        "--cover-stripe-opacity": showRightStripe ? "0.55" : "0",
        "--cover-stripe-text-opacity": showRightStripe ? "0.82" : "0",
      }}
      aria-hidden="true"
    >
      {layers.map((cfg, i) => (
        <span
          key={i}
          className={`generated-cover__layer ${
            i === 0
              ? "generated-cover__layer--letter"
              : `generated-cover__layer--shape generated-cover__layer--shape${cfg.accentType}`
          }`}
          data-label={cfg.isLetter ? cfg.glyph : undefined}
          style={{
            "--layer-c4": cfg.palette[3],
            "--glyph-x": "50%",
            "--glyph-y": "50%",
            "--glyph-rotate": "-6deg",
            "--glyph-size": "clamp(6.2rem, 16vw, 12rem)",
            "--glyph-opacity": "0.64",
            "--shape-opacity": `${Math.max(0.14, 0.26 - i * 0.03)}`,
          }}
        />
      ))}
    </div>
  );
};

export default GeneratedCover;
