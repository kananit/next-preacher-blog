import Link from "next/link";
import React from "react";
import { BsArrowRightShort, BsArrowLeftShort } from "react-icons/bs";

const Pagination = ({ section, currentPage, totalPages, formatPageLink }) => {
  const hasPrevPage = currentPage > 1;
  const hasNextPage = totalPages > currentPage;

  const buildHref = (page) => {
    if (formatPageLink) return formatPageLink(page);
    if (page === 1) return section ? `/${section}` : "/";
    return `${section ? "/" + section : ""}/page/${page}`;
  };

  let pageList = [];
  for (let i = 1; i <= totalPages; i++) {
    pageList.push(i);
  }

  return (
    <>
      {totalPages > 1 && (
        <nav
          className="mb-4 mt-8 flex flex-wrap items-center justify-center gap-2"
          aria-label="Pagination"
        >
          {/* previous */}
          {hasPrevPage ? (
            <Link
              href={buildHref(currentPage - 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl text-xl text-dark transition hover:bg-primary/10 hover:text-primary dark:text-darkmode-light dark:hover:text-primary"
            >
              <BsArrowLeftShort />
            </Link>
          ) : (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl text-xl text-dark/30 dark:text-darkmode-light/30">
              <BsArrowLeftShort />
            </span>
          )}

          {/* page index */}
          {pageList.map((pagination, i) => (
            <React.Fragment key={`page-${i}`}>
              {pagination === currentPage ? (
                <span
                  aria-current="page"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-white"
                >
                  {pagination}
                </span>
              ) : (
                <Link
                  href={buildHref(pagination)}
                  passHref
                  className="inline-flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-medium text-dark transition hover:bg-primary/10 hover:text-primary dark:text-darkmode-light dark:hover:text-primary"
                >
                  {pagination}
                </Link>
              )}
            </React.Fragment>
          ))}

          {/* next page */}
          {hasNextPage ? (
            <Link
              href={buildHref(currentPage + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl text-xl text-dark transition hover:bg-primary/10 hover:text-primary dark:text-darkmode-light dark:hover:text-primary"
            >
              <BsArrowRightShort />
            </Link>
          ) : (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl text-xl text-dark/30 dark:text-darkmode-light/30">
              <BsArrowRightShort />
            </span>
          )}
        </nav>
      )}
    </>
  );
};

export default Pagination;
