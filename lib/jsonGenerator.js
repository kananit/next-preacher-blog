const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const config = require("../config/config.json");
const { blog_folder } = config.settings;
const jsonDir = "./.json";

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

// get post data from all sections
const sectionIds = ["posts", "notes"];
let allPosts = [];

sectionIds.forEach((sectionId) => {
  const sectionPath = path.join(`content/${sectionId}`);
  if (!fs.existsSync(sectionPath)) return;

  // Recursively collect all md files from directory and subdirectories
  const collectMdFiles = (dir, basePath = "") => {
    const entries = fs.readdirSync(dir);
    const files = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        files.push(
          ...collectMdFiles(fullPath, path.posix.join(basePath, entry))
        );
      } else if (entry.endsWith(".md") && !entry.startsWith("_")) {
        files.push(path.posix.join(basePath, entry));
      }
    }
    return files;
  };

  const allMdFiles = collectMdFiles(sectionPath);

  const posts = allMdFiles.map((filename) => {
    const slug = slugify(
      path
        .basename(filename)
        .replace(".md", "")
        .replace(/\./g, "-")
        .replace(/\s*—\s*/g, "-")
    );
    const postData = fs.readFileSync(
      path.join(sectionPath, filename),
      "utf-8"
    );
    const pageDataParsed = matter(postData);
    const { data } = pageDataParsed;
    let content = pageDataParsed.content;

    // Strip first ## heading from content (skip leading blank lines)
    const contentLines = content.split("\n");
    const firstNonEmptyIdx = contentLines.findIndex((line) => line.trim() !== "");
    if (
      firstNonEmptyIdx !== -1 &&
      contentLines[firstNonEmptyIdx].trim().startsWith("## ")
    ) {
      contentLines.splice(firstNonEmptyIdx, 1);
      content = contentLines.join("\n");
    }

    return {
      frontmatter: data,
      content: content,
      slug: slug,
      _section: sectionId,
    };
  });

  allPosts = allPosts.concat(posts);
});

try {
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir);
  }
  fs.writeFileSync(`${jsonDir}/posts.json`, JSON.stringify(allPosts));
} catch (err) {
  console.error(err);
}
