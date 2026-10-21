import PostSingle from "@layouts/PostSingle";
import { getSinglePage } from "@lib/contentParser";
import { getTaxonomyMeta } from "@lib/taxonomyParser";
import {
  stripContent,
  stripContentItem,
  slugify,
} from "@lib/utils/textConverter";
import { extractToc } from "@lib/utils/toc";
import parseMDX from "@lib/utils/mdxParser";
import readingTime from "@lib/utils/readingTime";

const SECTION = "notes";

// post single layout
const NotesArticle = ({
  post,
  mdxContent,
  readTime,
  slug,
  allCategories,
  relatedPosts,
  posts,
  toc,
}) => {
  const { frontmatter } = post;

  return (
    <PostSingle
      frontmatter={frontmatter}
      readTime={readTime}
      mdxContent={mdxContent}
      slug={slug}
      allCategories={allCategories}
      relatedPosts={relatedPosts}
      posts={posts}
      toc={toc}
      section={SECTION}
    />
  );
};

// get post single slug
export const getStaticPaths = () => {
  const allSlug = getSinglePage(`content/${SECTION}`);
  const paths = allSlug.map((item) => ({
    params: {
      single: item.slug,
    },
  }));

  return {
    paths,
    fallback: false,
  };
};

// get post single content
export const getStaticProps = async ({ params }) => {
  const { single } = params;
  const allPosts = getSinglePage(`content/${SECTION}`);
  const post = allPosts.find((p) => p.slug == single);
  const posts = stripContent(allPosts);
  // InnerPagination читает только slug/title/date. Полный frontmatter (описание,
  // обложка, категории) уезжал в props каждой страницы — ~22 КБ на страницу.
  const paginationPosts = posts.map(
    ({ slug, frontmatter: { title, date } }) => ({
      slug,
      frontmatter: { title, date },
    }),
  );
  const mdxContent = await parseMDX(post.content);
  const readTime = readingTime(post.content);
  // related posts — exclude current, sort by date descending
  const relatedPosts = allPosts
    .filter(
      (p) =>
        p.slug !== single &&
        post.frontmatter.categories.some((cate) =>
          p.frontmatter.categories.includes(cate),
        ),
    )
    .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
    // В layout показываются только 3 — остальные в пропсы не нужны
    .map(stripContentItem)
    .slice(0, 3);

  // all categories
  const categories = getTaxonomyMeta(`content/${SECTION}`, "categories");
  const categoriesWithPostsCount = categories.map((category) => {
    const filteredPosts = posts.filter((post) =>
      post.frontmatter.categories
        .map((item) => slugify(item))
        .includes(category.slug),
    );
    return {
      slug: category.slug,
      label: category.label,
      posts: filteredPosts.length,
    };
  });

  return {
    props: {
      post: { frontmatter: post.frontmatter, slug: post.slug },
      mdxContent: mdxContent,
      readTime: readTime,
      slug: single,
      allCategories: categoriesWithPostsCount,
      relatedPosts: relatedPosts,
      posts: paginationPosts,
      toc: extractToc(post.content),
    },
  };
};

export default NotesArticle;
