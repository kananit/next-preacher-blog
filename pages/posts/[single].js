import config from "@config/config.json";
import PostSingle from "@layouts/PostSingle";
import { getSinglePage } from "@lib/contentParser";
import { getCategoriesWithCount } from "@lib/taxonomyParser";
import { stripContent, stripContentItem } from "@lib/utils/textConverter";
import parseMDX from "@lib/utils/mdxParser";
const { blog_folder } = config.settings;

// post single layout
const Article = ({
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
      section={blog_folder}
    />
  );
};

// get post single slug
export const getStaticPaths = () => {
  const allSlug = getSinglePage(`content/${blog_folder}`);
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
  const allPosts = getSinglePage(`content/${blog_folder}`);
  const post = allPosts.find((p) => p.slug == single);
  const posts = stripContent(allPosts);
  const mdxContent = await parseMDX(post.content);
  // related posts — exclude current, sort by date descending
  const relatedPosts = allPosts
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
    )
    .map(stripContentItem);

  //all categories
  const categoriesWithPostsCount = getCategoriesWithCount(`content/${blog_folder}`);
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

export default Article;
