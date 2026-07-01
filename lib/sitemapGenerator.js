const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const config = require("../config/config.json");

const SITE_URL = "https://hosea.ru";
const PAGINATION = config.settings.pagination;

// Cyrillic transliteration — duplicate of jsonGenerator logic to compute slugs
const CYRILLIC_TO_LATIN_MAP = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e",
  ю: "yu", я: "ya",
};

const transliterateToAscii = (content) => {
  return String(content)
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .split("")
    .map((char) => CYRILLIC_TO_LATIN_MAP[char] ?? char)
    .join("");
};

const slugify = (content) => {
  if (!content) return null;
  return transliterateToAscii(content)
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

/**
 * Recursively collect all .md files (non-_index) from a directory.
 */
const collectMdFiles = (dir, basePath = "") => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...collectMdFiles(fullPath, path.posix.join(basePath, entry)));
    } else if (entry.endsWith(".md") && !entry.startsWith("_")) {
      files.push(path.posix.join(basePath, entry));
    }
  }
  return files;
};

/**
 * Get all published posts from a content folder.
 */
const getPublishedPosts = (folder) => {
  const allMdFiles = collectMdFiles(folder);
  return allMdFiles
    .map((filename) => {
      const slug = slugify(
        path
          .basename(filename)
          .replace(".md", "")
          .replace(/\./g, "-")
          .replace(/\s*—\s*/g, "-")
      );
      const postData = fs.readFileSync(path.join(folder, filename), "utf-8");
      const { data } = matter(postData);
      if (data.draft) return null;
      return { slug, date: data.date || null };
    })
    .filter(Boolean);
};

/**
 * Escape XML special characters.
 */
const xmlEscape = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/**
 * Add trailing slash to non-root URLs (site uses trailingSlash: true).
 */
const withSlash = (loc) => (loc === "/" ? loc : `${loc}/`);

/**
 * Generate a <url> entry.
 */
const urlEntry = (loc, priority = "0.5", changefreq = "weekly") => {
  const fullUrl = `${SITE_URL}${withSlash(loc)}`;
  return `  <url>
    <loc>${xmlEscape(fullUrl)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
};

/**
 * Main generator.
 */
const generateSitemap = () => {
  const urls = [];

  // --- Static pages ---
  urls.push(urlEntry("/", "1.0", "daily"));
  urls.push(urlEntry("/about", "0.6", "monthly"));
  urls.push(urlEntry("/contact", "0.3", "monthly"));
  urls.push(urlEntry("/search", "0.3", "monthly"));
  urls.push(urlEntry("/categories", "0.7", "weekly"));

  // --- Posts ---
  const postsFolder = "content/posts";
  const posts = getPublishedPosts(postsFolder);
  const notesFolder = "content/notes";
  const notes = getPublishedPosts(notesFolder);

  // Individual post and note pages
  for (const post of posts) {
    urls.push(urlEntry(`/posts/${post.slug}`, "0.8", "monthly"));
  }
  for (const note of notes) {
    urls.push(urlEntry(`/notes/${note.slug}`, "0.8", "monthly"));
  }

  // Posts pagination
  const postsTotalPages = Math.ceil(posts.length / PAGINATION);
  for (let i = 1; i <= postsTotalPages; i++) {
    const loc = i === 1 ? "/posts" : `/posts/page/${i}`;
    urls.push(urlEntry(loc, "0.6", "weekly"));
  }

  // Notes pagination
  const notesTotalPages = Math.ceil(notes.length / PAGINATION);
  for (let i = 1; i <= notesTotalPages; i++) {
    const loc = i === 1 ? "/notes" : `/notes/page/${i}`;
    urls.push(urlEntry(loc, "0.6", "weekly"));
  }

  // --- Category pages ---
  // Collect unique categories from posts and notes
  const allCategories = new Set();
  const sectionIds = ["posts", "notes"];
  for (const sectionId of sectionIds) {
    const folder = `content/${sectionId}`;
    if (!fs.existsSync(folder)) continue;
    const mdFiles = collectMdFiles(folder);
    for (const filename of mdFiles) {
      const postData = fs.readFileSync(path.join(folder, filename), "utf-8");
      const { data } = matter(postData);
      if (data.draft) continue;
      if (Array.isArray(data.categories)) {
        for (const cat of data.categories) {
          allCategories.add(slugify(cat));
        }
      }
    }
  }

  for (const catSlug of allCategories) {
    urls.push(urlEntry(`/categories/${catSlug}`, "0.5", "weekly"));
  }

  // --- Build XML ---
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

  // Write to public/ so Next.js copies it to out/ during static export
  const outputPath = path.join(__dirname, "..", "public", "sitemap.xml");
  fs.writeFileSync(outputPath, sitemap, "utf-8");
  console.log(`✓ Sitemap generated: ${outputPath} (${urls.length} URLs)`);
};

generateSitemap();
