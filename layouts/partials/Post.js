import config from "@config/config.json";
import GeneratedCover from "@layouts/components/GeneratedCover";
import dateFormat from "@lib/utils/dateFormat";
import { highlightText } from "@lib/utils/highlight";
import { plainify, slugify } from "@lib/utils/textConverter";
import Link from "next/link";
import { FaRegCalendar, FaUserAlt } from "react-icons/fa";

// Category palette mapping — matches GeneratedCover colors
const CATEGORY_PALETTE = {
  аш: { accent: "#2c4fa0", light: "#b8c8e0" },
  "олег мамонтов": { accent: "#7d2ca0", light: "#d4b8e0" },
  "владимир михайлов": { accent: "#a02c4f", light: "#e8b8c8" },
};
const getCategoryColor = (category) => {
  const key = (category || "").toLowerCase().trim();
  return CATEGORY_PALETTE[key] || null;
};

const Post = ({ post, highlight }) => {
  const { summary_length, blog_folder } = config.settings;
  const { meta_author } = config.metadata;
  const excerpt = plainify(post.frontmatter.description || post.content) || "";
  const author = post.frontmatter.author
    ? post.frontmatter.author
    : meta_author;
  const categories = post.frontmatter.categories || [];

  return (
    <div
      className={`post flex h-full flex-col overflow-hidden rounded border border-border bg-white dark:border-darkmode-border dark:bg-darkmode-body`}
    >

      <div className="relative">
        <GeneratedCover post={post} />
        <ul className="absolute left-2 top-3 flex flex-wrap items-center gap-y-2">
          {categories.map((tag, index) => {
            const catColor = getCategoryColor(tag);
            return (
              <li
                className="mx-1 inline-flex h-7 items-center gap-1.5 rounded-[35px] bg-primary px-3 text-white sm:mx-1.5"
                key={"tag-" + index}
                style={catColor ? { backgroundColor: catColor.accent } : {}}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full bg-white/60 shrink-0"
                  style={{ backgroundColor: catColor?.light || "#fff" }}
                />
                <Link
                  className="capitalize"
                  href={`/categories/${slugify(tag)}`}
                >
                  {tag}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="h5 mb-2">
          <Link
            href={`/${blog_folder}/${post.slug}`}
            className="block hover:text-primary"
          >
            {highlight ? highlightText(post.frontmatter.title, highlight) : post.frontmatter.title}
          </Link>
        </h3>
        <ul className="mb-3 flex items-center space-x-4">
          <li>
            <Link
              className="inline-flex items-center font-secondary text-xs leading-3"
              href="/about"
            >
              <FaUserAlt className="mr-1.5" />
              {author}
            </Link>
          </li>
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
          href={`/${blog_folder}/${post.slug}`}
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
