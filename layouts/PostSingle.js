import { getCategoryDotColor } from "@lib/utils/categoryColors";
import config from "@config/config.json";
import Base from "@layouts/Baseof";
import GeneratedCover from "@layouts/components/GeneratedCover";
import InnerPagination from "@layouts/components/InnerPagination";
import dateFormat from "@lib/utils/dateFormat";
import { markdownify, plainify, slugify } from "@lib/utils/textConverter";
import { DiscussionEmbed } from "disqus-react";
import { MDXRemote } from "next-mdx-remote";
import { useTheme } from "next-themes";
import Link from "next/link";
import { FaRegCalendar, FaRegClock } from "react-icons/fa";
import Post from "./partials/Post";
import shortcodes from "./shortcodes/all";
import readingTime from "@lib/utils/readingTime";
const { disqus } = config;

const PostSingle = ({
  frontmatter,
  content,
  mdxContent,
  slug,
  posts,
  allCategories,
  relatedPosts,
}) => {
  let { description, title, date, categories } = frontmatter;
  description = description ? description : plainify(content)?.slice(0, 120);

  const { theme } = useTheme();
  // Local copy so we don't modify global config.
  let disqusConfig = config.disqus.settings;
  disqusConfig.identifier = frontmatter.disqusId
    ? frontmatter.disqusId
    : config.settings.blog_folder + "/" + slug;

  return (
    <Base title={title} description={description}>
      <section className="section single-blog mt-2 pb-0">
        <div className="container">
          <div className="row">
            <div className="lg:col-12">
              <article className="mx-auto max-w-[720px]">
                <div className="relative">
                  <GeneratedCover
                    post={{ frontmatter, slug }}
                    className="min-h-[180px] md:min-h-[230px] lg:min-h-[280px]"
                  />
                  {/* Categories now rendered below the cover */}
                </div>
                {config.settings.InnerPaginationOptions.enableTop && (
                  <div className="mt-4">
                    <InnerPagination posts={posts} slug={slug} />
                  </div>
                )}
                {/* Categories */}
                {categories.length > 0 && (
                  <ul className="mb-4 mt-4 flex flex-wrap items-center gap-1.5">
                    {categories.map((tag, index) => {
                      const dotColor = index === 0 ? getCategoryDotColor(tag) : "currentColor";
                      return (
                        <li key={"tag-" + index}>
                          <Link
                            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary transition hover:bg-primary/20 dark:bg-primary/15 dark:hover:bg-primary/25"
                            href={`/categories/${slugify(tag)}`}
                          >
                            <span
                              className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: dotColor }}
                            />
                            <span className="capitalize">{tag}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {markdownify(title, "h1", "lg:text-[42px] my-4 mb-3")}
                <ul className="flex items-center space-x-4">
                  <li className="inline-flex items-center font-secondary text-xs leading-3">
                    <FaRegClock className="mr-1.5" />
                    {readingTime(content)}
                  </li>
                  <li className="inline-flex items-center font-secondary text-xs leading-3">
                    <FaRegCalendar className="mr-1.5" />
                    {dateFormat(date)}
                  </li>
                </ul>
                <div className="content mb-8">
                  <MDXRemote {...mdxContent} components={shortcodes} />
                </div>
                {config.settings.InnerPaginationOptions.enableBottom && (
                  <div className="mt-8 mb-2">
                    <InnerPagination posts={posts} slug={slug} />
                  </div>
                )}
              </article>
              <div className="mt-16">
                {disqus.enable && (
                  <DiscussionEmbed
                    key={theme}
                    shortname={disqus.shortname}
                    config={disqusConfig}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related posts — only show if 2+ */}
        {relatedPosts.length >= 2 && (
          <div className="container mt-4">
            <h2 className="section-title mb-8">Похожие записи</h2>
            <div className="row mt-8">
              {relatedPosts.slice(0, 3).map((post, index) => (
                <div key={"post-" + index} className="mb-8 lg:col-4">
                  <Post post={post} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </Base>
  );
};

export default PostSingle;
