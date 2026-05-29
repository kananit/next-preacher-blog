import config from "@config/config.json";
import Base from "@layouts/Baseof";
import ImageFallback from "@layouts/components/ImageFallback";
import Logo from "@layouts/components/Logo";
import Post from "@layouts/partials/Post";
import Sidebar from "@layouts/partials/Sidebar";
import { getListPage, getSinglePage } from "@lib/contentParser";
import { sortByDate } from "@lib/utils/sortFunctions";
import { markdownify } from "@lib/utils/textConverter";
import Link from "next/link";
const { blog_folder } = config.settings;
const { about } = config.widgets;

const Home = ({ banner, posts, recent_posts }) => {
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
          <div className="row">
            <div className="mb-12 lg:col-8 lg:mb-0">
              {/* Recent Posts */}
              {recent_posts.enable && (
                <div className="pt-0">
                  <div className="row">
                    {sortPostByDate.slice(0, 4).map((post) => (
                      <div className="mb-8 md:col-6" key={post.slug}>
                        <Post post={post} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* About block */}
              {about.enable && (
                <div className="relative rounded border border-border p-6 text-center dark:border-darkmode-border">
                  <ImageFallback
                    className="-z-[1]"
                    src="/images/map.svg"
                    fill={true}
                    alt="bg-map"
                  />
                  <Logo />
                  {markdownify(about.content, "p", "mt-6")}
                </div>
              )}
            </div>
            {/* sidebar */}
            <Sidebar posts={posts} />
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

  return {
    props: {
      banner: banner,
      posts: posts,
      recent_posts,
    },
  };
};
