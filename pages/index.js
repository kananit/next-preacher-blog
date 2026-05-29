import config from "@config/config.json";
import Base from "@layouts/Baseof";
import ImageFallback from "@layouts/components/ImageFallback";
import Post from "@layouts/partials/Post";
import Sidebar from "@layouts/partials/Sidebar";
import { getListPage, getSinglePage } from "@lib/contentParser";
import { getTaxonomyMeta } from "@lib/taxonomyParser";
import { sortByDate } from "@lib/utils/sortFunctions";
import { markdownify, slugify } from "@lib/utils/textConverter";
import Link from "next/link";
const { blog_folder } = config.settings;

const Home = ({ banner, posts, recent_posts, categories }) => {
  const sortPostByDate = sortByDate(posts);

  return (
    <Base>
      {/* Banner */}
      <section className="section banner relative pb-0 lg:mt-8">
        <ImageFallback
          className="absolute bottom-0 left-0 z-[-1] w-full"
          src={"/images/banner-bg-shape.svg"}
          width={1905}
          height={295}
          alt="banner-shape"
          priority
        />

        <div className="container">
          <div className="row flex-wrap-reverse items-center justify-center lg:flex-row">
            <div
              className={
                banner.image_enable
                  ? "mb-4 mt-12 text-center lg:col-6 lg:mt-0 lg:text-left"
                  : "mb-4 mt-12 text-center lg:col-12 lg:mt-0 lg:text-left"
              }
            >
              <div className="banner-title">
                {markdownify(banner.title, "h1")}
                {markdownify(banner.title_small, "span")}
              </div>
              {markdownify(banner.content, "p", "mt-4 sm:block hidden")}
              {banner.button.enable && (
                <Link
                  className="btn btn-primary mt-6"
                  href={banner.button.link}
                  rel={banner.button.rel}
                >
                  {banner.button.label}
                </Link>
              )}
            </div>
            {banner.image_enable && (
              <div className="col-9 lg:col-6">
                <ImageFallback
                  className="mx-auto object-contain"
                  src={banner.image}
                  width={548}
                  height={443}
                  priority={true}
                  alt="Banner Image"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Home main */}
      <section className="section lg:py-8">
        <div className="container">
          <div className="row items-start">
            <div className="mb-12 lg:col-8 lg:mb-0">
              {/* Recent Posts */}
              {recent_posts.enable && (
                <div className="section pt-0">
                  <div className="row">
                    {sortPostByDate.slice(0, 3).map((post) => (
                      <div className="mb-8 md:col-6 lg:col-4" key={post.slug}>
                        <Post post={post} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Link
                      href="/page/1"
                      className="inline-flex items-center gap-2 font-bold text-primary transition hover:gap-3"
                    >
                      Все записи
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            {/* sidebar */}
            <Sidebar
              posts={posts}
              categories={categories}
            />
          </div>
        </div>
      </section>
    </Base>
  );
};

export default Home;

// for homepage data
export const getStaticProps = async () => {
  const homepage = await getListPage("content/_index.md");
  const { frontmatter } = homepage;
  const { banner, recent_posts } = frontmatter;
  const posts = getSinglePage(`content/${blog_folder}`);
  const categories = getTaxonomyMeta(`content/${blog_folder}`, "categories");

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
      banner: banner,
      posts: posts,
      recent_posts,
      categories: categoriesWithPostsCount,
    },
  };
};
