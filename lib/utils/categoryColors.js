// Category palette for the dot indicator on post cards and single pages
const CATEGORY_PALETTE = {
  аш: "#2c4fa0",
  "олег мамонтов": "#7d2ca0",
  "владимир михайлов": "#a02c4f",
};

/**
 * Returns a custom dot color for a category, or null to fall back to primary.
 */
export const getCategoryDotColor = (category) => {
  const key = (category || "").toLowerCase().trim();
  return CATEGORY_PALETTE[key] || null;
};
