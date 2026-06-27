import { getSinglePage } from "@lib/contentParser";
import { slugify } from "@lib/utils/textConverter";

// Русские служебные слова, которые не капитализируем в середине категории
const LOWERCASE_WORDS = new Set([
  "к", "ко", "в", "во", "с", "со", "на", "за", "о", "об", "от", "ото",
  "по", "под", "подо", "над", "перед", "передо", "при", "без", "до",
  "из", "изо", "у", "и", "а", "но", "или", "не", "ни", "для", "про",
  "через", "сквозь", "ради", "насчёт", "вроде", "словно", "будто",
  "чтобы", "что", "как", "так", "же", "ли", "бы",
]);

// get all taxonomies from frontmatter
export const getTaxonomy = (folder, name) => {
  return getTaxonomyMeta(folder, name).map((taxonomy) => taxonomy.slug);
};

export const getTaxonomyMeta = (folder, name) => {
  const singlePages = getSinglePage(folder);
  const taxonomyPages = singlePages.map((page) => page.frontmatter[name]);
  const taxonomies = new Map();
  for (let i = 0; i < taxonomyPages.length; i++) {
    if (taxonomyPages[i] === undefined) {
      continue;
    }
    const isArray = Array.isArray(taxonomyPages[i]);
    const categoryArray = isArray ? taxonomyPages[i] : [taxonomyPages[i]];
    for (let j = 0; j < categoryArray.length; j++) {
      const label = categoryArray[j]
        .split(" ")
        .map((w, idx) =>
          idx > 0 && LOWERCASE_WORDS.has(w.toLowerCase())
            ? w
            : w.charAt(0).toUpperCase() + w.slice(1)
        )
        .join(" ");
      const slug = slugify(label);
      if (!taxonomies.has(slug)) {
        taxonomies.set(slug, { slug, label });
      }
    }
  }
  return Array.from(taxonomies.values());
};

// Получить категории с количеством постов для каждого раздела
// isPrimary = true, если категория встречается первой хотя бы в одном посте
export const getCategoriesWithCount = (folder) => {
  const posts = getSinglePage(folder);
  const categories = getTaxonomyMeta(folder, "categories");
  return categories.map((cat) => {
    const postsWithCat = posts.filter((p) =>
      p.frontmatter.categories
        ?.map((c) => slugify(c))
        .includes(cat.slug)
    );
    const primaryCount = posts.filter(
      (p) => slugify(p.frontmatter.categories?.[0] || "") === cat.slug
    ).length;
    return {
      ...cat,
      posts: postsWithCat.length,
      isPrimary: primaryCount > 0,
      primaryPosts: primaryCount,
    };
  });
};
