// CategoryPalette.js — единый источник истины для цветов категорий
// Используется и для точки на плашке (dot), и для обложки (cover)
// Все категории хранятся с ключом в нижнем регистре

const CATEGORY_PALETTES = {
  аш: {
    dot: "#2c4fa0",
    cover: ["#8aacd4", "#2c4fa0", "#dae0f0", "#183a6e"],
  },
  "олег мамонтов": {
    dot: "#a02c4f",
    cover: ["#d4a0b0", "#a02c4f", "#f5e0e7", "#6e1832"],
  },
  "владимир михайлов": {
    dot: "#a02c4f",
    cover: ["#d4a0b0", "#a02c4f", "#f5e0e7", "#6e1832"],
  },
  статьи: {
    dot: "#0e7c7b",
    cover: ["#a0d0c8", "#0e7c7b", "#dcefec", "#075754"],
  },
  книги: {
    dot: "#7d2ca0",
    cover: ["#c0a0d4", "#7d2ca0", "#eadaf0", "#4e186e"],
  },
};

const FALLBACK = {
  dot: "#8B7D6B",
  cover: ["#e0d9cd", "#8a7f6f", "#efe9df", "#5f5548"],
};

export const getPalette = (category) => {
  const key = (category || "").toLowerCase().trim();
  return CATEGORY_PALETTES[key] || FALLBACK;
};

export const getCategoryDotColor = (category) => {
  return getPalette(category).dot;
};

export const getCoverPalette = (category) => {
  return getPalette(category).cover;
};

export { FALLBACK };

// Алиас для обратной совместимости
export const FALLBACK_COLOR = FALLBACK.dot;
