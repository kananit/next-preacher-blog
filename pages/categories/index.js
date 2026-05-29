import config from "@config/config.json";
import Base from "@layouts/Baseof";
import { getTaxonomyMeta } from "@lib/taxonomyParser";
import { markdownify, slugify } from "@lib/utils/textConverter";
import Link from "next/link";
const { blog_folder } = config.settings;
import { getSinglePage } from "@lib/contentParser";
import { FaFolder, FaFire, FaStar } from "react-icons/fa";

const Categories = ({ categories, totalPosts }) => {
  const sortedCategories = [...categories].sort((a, b) => b.posts - a.posts);

  return (
    <Base title={"categories"}>
      <section className="section pt-0">
        {markdownify(
          "Категории",
          "h1",
          "h2 lg:mb-4 bg-theme-light dark:bg-darkmode-theme-dark py-12 text-center lg:text-[55px]"
        )}
        <div className="container pt-8 text-center">
          <p className="mb-10 text-lg text-text dark:text-darkmode-text">
            Все рубрики блога — {totalPosts} записей в {categories.length} категориях
          </p>
          <ul className="row">
            {sortedCategories.map((category, i) => {
              const isTop = i === 0;
              const isSecond = i === 1;
              const isThird = i === 2;

              return (
                <li
                  key={`category-${i}`}
                  className="mt-4 block lg:col-4 xl:col-3"
                >
                  <Link
                    href={`/categories/${category.slug}`}
                    className={`flex w-full items-center justify-center rounded-lg px-4 py-4 font-bold text-dark transition hover:bg-primary hover:text-white dark:text-darkmode-light dark:hover:bg-primary dark:hover:text-white ${
                      isTop
                        ? "bg-primary/10 ring-2 ring-primary/30 dark:bg-darkmode-theme-dark"
                        : isSecond
                        ? "bg-primary/[0.07] ring-1 ring-primary/15 dark:bg-darkmode-theme-dark"
                        : "bg-theme-light dark:bg-darkmode-theme-dark"
                    }`}
                  >
                    {isTop ? (
                      <FaFire className="mr-1.5 text-primary" />
                    ) : (
                      <FaFolder className="mr-1.5" />
                    )}
                    {category.label}
                    <span
                      className={`ml-2 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isTop
                          ? "bg-primary text-white"
                          : "bg-white text-dark dark:bg-darkmode-border dark:text-darkmode-light"
                      }`}
                    >
                      {isTop && <FaStar className="text-[10px]" />}
                      {category.posts}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </Base>
  );
};

export default Categories;

export const getStaticProps = () => {
  const posts = getSinglePage(`content/${blog_folder}`);
  const categories = getTaxonomyMeta(`content/${blog_folder}`, "categories");
  const categoriesWithPostsCount = categories.map((category) => {
    const filteredPosts = posts.filter((post) =>
      post.frontmatter.categories.map((e) => slugify(e)).includes(category.slug)
    );
    return {
      slug: category.slug,
      label: category.label,
      posts: filteredPosts.length,
    };
  });
  return {
    props: {
      categories: categoriesWithPostsCount,
      totalPosts: posts.length,
    },
  };
};
