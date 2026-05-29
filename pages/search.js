import Base from "@layouts/Baseof";
import { slugify } from "@lib/utils/textConverter";
import Post from "@partials/Post";
import { useSearchContext } from "context/state";
import { useRouter } from "next/router";

const SearchPage = () => {
  const router = useRouter();
  const { query } = router;
  const keyword = slugify(query.key);
  const { posts } = useSearchContext();

  const searchResults = posts.filter((product) => {
    if (product.frontmatter.draft) {
      return !product.frontmatter.draft;
    }
    if (slugify(product.frontmatter.title).includes(keyword)) {
      return product;
    } else if (
      product.frontmatter.categories.find((category) =>
        slugify(category).includes(keyword)
      )
    ) {
      return product;
    } else if (slugify(product.content).includes(keyword)) {
      return product;
    }
  });

  const resultsCount = searchResults.length;

  return (
    <Base title={`Результаты поиска ${query.key}`}>
      <div className="section pt-4">
        <div className="container">
          {/* Header */}
          <div className="mb-10">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary dark:bg-primary/20">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              Поиск
            </span>
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h1 className="h2 capitalize">{query.key}</h1>
              <span className="text-sm text-text dark:text-darkmode-text">
                {resultsCount === 0
                  ? "ничего не найдено"
                  : `${resultsCount} ${resultsCount === 1 ? "результат" : resultsCount < 5 ? "результата" : "результатов"}`}
              </span>
            </div>
          </div>
          {searchResults.length > 0 ? (
            <div className="row">
              {searchResults.map((post, i) => (
                <div key={`key-${i}`} className="mb-8 md:col-6 lg:col-4">
                  <Post post={post} highlight={query.key} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center text-h3 shadow">
              No Search Found
            </div>
          )}
        </div>
      </div>
    </Base>
  );
};

export default SearchPage;
