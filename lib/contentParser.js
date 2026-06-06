import parseMDX from "@lib/utils/mdxParser";
import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { isPublishedOnOrBeforeToday } from "./utils/parseDate";
import { slugify } from "./utils/textConverter";

// get list page data, ex: _index.md
export const getListPage = async (filePath) => {
  const pageData = fs.readFileSync(filePath, "utf-8");
  const pageDataParsed = matter(pageData);
  const notFoundPage = fs.readFileSync("content/404.md", "utf-8");
  const notFoundDataParsed = matter(notFoundPage);
  let frontmatter, content;

  if (pageDataParsed) {
    content = pageDataParsed.content;
    frontmatter = pageDataParsed.data;
  } else {
    content = notFoundDataParsed.content;
    frontmatter = notFoundDataParsed.data;
  }
  const mdxContent = await parseMDX(content);

  return {
    frontmatter,
    content,
    mdxContent,
  };
};

// get all single pages, ex: blog/post.md
// Supports nested subdirectories of any depth (e.g. posts/ash/shkola-dukha/file.md)
export const getSinglePage = (folder) => {
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

  const allMdFiles = collectMdFiles(folder);

  const singlePages = allMdFiles.map((filename) => {
    const slug = slugify(
      path
        .basename(filename)
        .replace(".md", "")
        .replace(/\./g, "-")
        .replace(/\s*—\s*/g, "-")
    );
    const pageData = fs.readFileSync(path.join(folder, filename), "utf-8");
    const pageDataParsed = matter(pageData);
    const frontmatterString = JSON.stringify(pageDataParsed.data);
    const frontmatter = JSON.parse(frontmatterString);
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

    const url = frontmatter.url ? frontmatter.url.replace("/", "") : slug;
    return { frontmatter: frontmatter, slug: url, content: content };
  });

  const publishedPages = singlePages.filter(
    (page) =>
      !page.frontmatter.draft && page.frontmatter.layout !== "404" && page
  );
  const filterByDate = publishedPages.filter((page) =>
    isPublishedOnOrBeforeToday(page.frontmatter.date)
  );

  return filterByDate;
};

// get a regular page data from many pages, ex: about.md
export const getRegularPage = async (slug) => {
  const publishedPages = getSinglePage("content");
  const pageData = publishedPages.filter((data) => data.slug === slug);
  const notFoundPage = fs.readFileSync("content/404.md", "utf-8");
  const notFoundDataParsed = matter(notFoundPage);

  let frontmatter, content;
  if (pageData[0]) {
    content = pageData[0].content;
    frontmatter = pageData[0].frontmatter;
  } else {
    content = notFoundDataParsed.content;
    frontmatter = notFoundDataParsed.data;
  }
  const mdxContent = await parseMDX(content);

  return {
    frontmatter,
    content,
    mdxContent,
  };
};
