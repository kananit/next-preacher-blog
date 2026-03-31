import { getSinglePage } from "@lib/contentParser";
import { slugify } from "@lib/utils/textConverter";

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
      const label = categoryArray[j];
      const slug = slugify(label);
      if (!taxonomies.has(slug)) {
        taxonomies.set(slug, { slug, label });
      }
    }
  }
  return Array.from(taxonomies.values());
};
