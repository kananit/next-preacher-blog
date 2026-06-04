// Category palette for the dot indicator on post cards and single pages
const CATEGORY_PALETTE = {
  аш: "#2c4fa0",
  "олег мамонтов": "#a02c4f",
  "владимир михайлов": "#a02c4f",
  статьи: "#0e7c7b",
  книги: "#7d2ca0",
};

// Fallback — тёплый серо-коричневый для первой категории без заданного цвета
const FALLBACK_COLOR = "#8B7D6B";

export { FALLBACK_COLOR };

/**
 * Returns a custom dot color for a category, or null to fall back to primary/currentColor.
 */
export const getCategoryDotColor = (category) => {
  const key = (category || "").toLowerCase().trim();
  return CATEGORY_PALETTE[key] || null;
};
