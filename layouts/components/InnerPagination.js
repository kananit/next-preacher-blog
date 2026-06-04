import config from "@config/config.json";
import { sortByDate } from "@lib/utils/sortFunctions";
import Link from "next/link";

const { blog_folder } = config.settings;

const InnerPagination = ({ posts, slug }) => {
  const orderedPosts = sortByDate(posts);
  const lastIndex = orderedPosts.length - 1;
  const postIndex = orderedPosts.findIndex(
    (post) => post.slug == slug
  );
  const next = postIndex == 0 ? undefined : orderedPosts[postIndex - 1].slug;
  const prev =
    postIndex == lastIndex ? undefined : orderedPosts[postIndex + 1].slug;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
      {prev ? (
        <Link
          href={`/${blog_folder}/${prev}`}
          className="group inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
        >
          <svg
            className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16l-4-4m0 0l4-4m-4 4h18"
            />
          </svg>
          Предыдущее
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/${blog_folder}/${next}`}
          className="group inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
        >
          Следующее
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
      ) : (
        <div />
      )}
    </div>
  );
};

export default InnerPagination;
