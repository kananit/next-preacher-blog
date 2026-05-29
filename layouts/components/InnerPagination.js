import { sortByDate } from "@lib/utils/sortFunctions";
import Link from "next/link";

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
    <div className="-mx-2 flex flex-wrap items-center justify-between gap-4">
      {prev ? (
        <Link
          href={prev}
          className="group inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-secondary text-sm font-bold text-dark transition hover:border-primary hover:text-primary dark:border-darkmode-border dark:text-darkmode-light dark:hover:border-primary dark:hover:text-primary"
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
          href={next}
          className="group inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-secondary text-sm font-bold text-dark transition hover:border-primary hover:text-primary dark:border-darkmode-border dark:text-darkmode-light dark:hover:border-primary dark:hover:text-primary"
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
