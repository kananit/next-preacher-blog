import config from "@config/config.json";
import Base from "@layouts/Baseof";
import { getSinglePage } from "@lib/contentParser";
import { getTaxonomyMeta } from "@lib/taxonomyParser";
import { slugify } from "@lib/utils/textConverter";
import Post from "@partials/Post";
const { blog_folder } = config.settings;

// category page
const Category = ({
  postsByCategories,
  categoryLabel,
}) => {
  const postsCount = postsByCategories.length;

  return (
    <Base title={categoryLabel}>
      <div className="section pt-4">
        <div className="container">
          {/* Header */}
          <div className="mb-10">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary dark:bg-primary/20">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zm6-6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Категория
            </span>
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h1 className="h2 capitalize">{categoryLabel}</h1>
              <span className="text-sm text-text dark:text-darkmode-text">
                {postsCount === 0
                  ? "нет записей"
                  : `${postsCount} ${postsCount === 1 ? "запись" : postsCount < 5 ? "записи" : "записей"}`}
              </span>
            </div>
          </div>

          {postsByCategories.length > 0 ? (
            <div className="row">
              {postsByCategories.map((post, i) => (
                <div key={`key-${i}`} className="mb-8 md:col-6 lg:col-4">
                  <Post post={post} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-theme-light p-12 text-center dark:bg-darkmode-theme-dark">
              <svg
                className="mx-auto mb-4 h-16 w-16 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <h3 className="h4 mb-2">Здесь пока пусто</h3>
              <p className="text-text dark:text-darkmode-text">
                В этой категории ещё нет записей. Попробуйте заглянуть в другие рубрики.
              </p>
            </div>
          )}
        </div>
      </div>
    </Base>
  );
};

export default Category;

// category page routes
export const getStaticPaths = () => {
  const allCategories = getTaxonomyMeta(`content/${blog_folder}`, "categories");

  const paths = allCategories.map((category) => ({
    params: {
      category: category.slug,
    },
  }));

  return { paths, fallback: false };
};

// category page data
export const getStaticProps = ({ params }) => {
  const posts = getSinglePage(`content/${blog_folder}`);
  const filterPosts = posts.filter((post) =>
    post.frontmatter.categories.find(
      (category) => slugify(category) === params.category
    )
  );
  const categories = getTaxonomyMeta(`content/${blog_folder}`, "categories");
  const activeCategory = categories.find(
    (category) => category.slug === params.category
  );

  return {
    props: {
      postsByCategories: filterPosts,
      categoryLabel: activeCategory?.label || params.category,
    },
  };
};
