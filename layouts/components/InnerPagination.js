import config from "@config/config.json";
import { sortByDate } from "@lib/utils/sortFunctions";
import { plainify } from "@lib/utils/textConverter";
import Link from "next/link";

const { blog_folder } = config.settings;

const InnerPagination = ({ posts, slug }) => {
  const orderedPosts = sortByDate(posts);
  const lastIndex = orderedPosts.length - 1;
  const postIndex = orderedPosts.findIndex(
    (post) => post.slug == slug
  );
  const prevPost = postIndex == lastIndex ? undefined : orderedPosts[postIndex + 1];
  const nextPost = postIndex == 0 ? undefined : orderedPosts[postIndex - 1];

  return (
    <nav className="flex items-stretch justify-between">
      {prevPost ? (
        <Link
          href={`/${blog_folder}/${prevPost.slug}`}
          className="group flex w-1/2 flex-col justify-center gap-1 py-5 pr-4 transition"
        >
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            <svg
              className="h-3 w-3 transition-transform duration-200 group-hover:-translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Назад
          </span>
          <span className="truncate text-sm text-dark dark:text-darkmode-light">
            {plainify(prevPost.frontmatter.title)}
          </span>
        </Link>
      ) : (
        <div className="w-1/2" />
      )}

      {prevPost && nextPost && (
        <div className="my-5 h-auto w-px shrink-0 bg-border dark:bg-darkmode-border" />
      )}

      {nextPost ? (
        <Link
          href={`/${blog_folder}/${nextPost.slug}`}
          className="group flex w-1/2 flex-col justify-center gap-1 py-5 pl-4 text-right transition"
        >
          <span className="flex items-center justify-end gap-1 text-xs font-medium text-primary">
            Вперёд
            <svg
              className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
          <span className="truncate text-sm text-dark dark:text-darkmode-light">
            {plainify(nextPost.frontmatter.title)}
          </span>
        </Link>
      ) : (
        <div className="w-1/2" />
      )}
    </nav>
  );
};

export default InnerPagination;
