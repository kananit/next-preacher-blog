import { getCategoryDotColor } from "@lib/utils/categoryColors";
import config from "@config/config.json";
import GeneratedCover from "@layouts/components/GeneratedCover";
import dateFormat from "@lib/utils/dateFormat";
import { highlightText } from "@lib/utils/highlight";
import { plainify, slugify } from "@lib/utils/textConverter";
import Link from "next/link";
import { FaRegCalendar } from "react-icons/fa";

const Post = ({ post, highlight, section }) => {
  const { summary_length, blog_folder } = config.settings;
  const excerpt = plainify(post.frontmatter.description || post.content) || "";
  const categories = post.frontmatter.categories || [];

  return (
    <div
      className={`post flex h-full flex-col overflow-hidden rounded border border-border bg-white dark:border-darkmode-border dark:bg-darkmode-body`}
    >

      <div className="relative">
        <GeneratedCover post={post} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        {/* Categories */}
        {categories.length > 0 && (
          <ul className="mb-3 flex flex-wrap items-center gap-1.5">
            {categories.slice(0, 2).map((tag, index) => {
              const dotColor = index === 0 ? getCategoryDotColor(tag) : "currentColor";
              return (
                <li className="inline-flex items-center" key={"tag-" + index}>
                  <Link
                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium leading-none text-primary transition hover:bg-primary/20 dark:bg-primary/15 dark:hover:bg-primary/25"
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
            {categories.length > 2 && (
              <li className="inline-flex items-center py-0.5 text-xs font-medium leading-none text-text dark:text-darkmode-text">
                +{categories.length - 2}
              </li>
            )}
          </ul>
        )}
        <h3 className="h5 mb-2">
          <Link
            href={`/${section || blog_folder}/${post.slug}`}
            className="block hover:text-primary"
          >
            {highlight ? highlightText(post.frontmatter.title, highlight) : post.frontmatter.title}
          </Link>
        </h3>
        <ul className="mb-3 flex items-center space-x-4">
          <li className="inline-flex items-center font-secondary text-xs leading-3">
            <FaRegCalendar className="mr-1.5" />
            {dateFormat(post.frontmatter.date)}
          </li>
        </ul>
        <p className="flex-1 text-sm leading-relaxed text-text dark:text-darkmode-text">
          {highlight
            ? highlightText(excerpt.slice(0, Number(summary_length)), highlight)
            : excerpt.slice(0, Number(summary_length))}
        </p>
        <Link
          className="group mt-4 inline-flex items-center gap-1.5 font-secondary text-sm font-bold text-primary transition hover:gap-2"
          href={`/${section || blog_folder}/${post.slug}`}
        >
          Читать
          <svg
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default Post;
