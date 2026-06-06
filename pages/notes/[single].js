import PostSingle from "@layouts/PostSingle";
import { getSinglePage } from "@lib/contentParser";
import { getTaxonomyMeta } from "@lib/taxonomyParser";
import parseMDX from "@lib/utils/mdxParser";
import { slugify } from "@lib/utils/textConverter";

const SECTION = "notes";

// post single layout
const NotesArticle = ({
  post,
  mdxContent,
  slug,
  allCategories,
  relatedPosts,
  posts,
}) => {
  const { frontmatter, content } = post;

  return (
    <PostSingle
      frontmatter={frontmatter}
      content={content}
      mdxContent={mdxContent}
      slug={slug}
      allCategories={allCategories}
      relatedPosts={relatedPosts}
      posts={posts}
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
  const posts = getSinglePage(`content/${SECTION}`);
  const post = posts.find((p) => p.slug == single);
  const mdxContent = await parseMDX(post.content);
  // related posts — exclude current, sort by date descending
  const relatedPosts = posts
    .filter(
      (p) =>
        p.slug !== single &&
        post.frontmatter.categories.some((cate) =>
          p.frontmatter.categories.includes(cate)
        )
    )
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date) - new Date(a.frontmatter.date)
    );

  // all categories
  const categories = getTaxonomyMeta(`content/${SECTION}`, "categories");
  const categoriesWithPostsCount = categories.map((category) => {
    const filteredPosts = posts.filter((post) =>
      post.frontmatter.categories
        .map((item) => slugify(item))
        .includes(category.slug)
    );
    return {
      slug: category.slug,
      label: category.label,
      posts: filteredPosts.length,
    };
  });

  return {
    props: {
      post: post,
      mdxContent: mdxContent,
      slug: single,
      allCategories: categoriesWithPostsCount,
      relatedPosts: relatedPosts,
      posts: posts,
    },
  };
};

export default NotesArticle;
