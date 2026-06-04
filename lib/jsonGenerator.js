const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const config = require("../config/config.json");
const { blog_folder } = config.settings;
const jsonDir = "./.json";

// get post data from all sections
const sectionIds = ["posts", "notes"];
let allPosts = [];

sectionIds.forEach((sectionId) => {
  const sectionPath = path.join(`content/${sectionId}`);
  if (!fs.existsSync(sectionPath)) return;

  const getPosts = fs.readdirSync(sectionPath);
  const filterPosts = getPosts.filter((post) => post.match(/^(?!_)/));
  const posts = filterPosts.map((filename) => {
    const slug = filename.replace(".md", "");
    const postData = fs.readFileSync(
      path.join(sectionPath, filename),
      "utf-8"
    );
    const { data } = matter(postData);
    const content = matter(postData).content;

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
