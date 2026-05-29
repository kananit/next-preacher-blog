import PageHeader from "@layouts/components/PageHeader";
import PostGrid from "@layouts/components/PostGrid";
import EmptyState from "@layouts/components/EmptyState";
import pluralize from "@lib/utils/pluralize";
import Base from "@layouts/Baseof";
import { plainify } from "@lib/utils/textConverter";
import { useSearchContext } from "context/state";
import { useRouter } from "next/router";

/**
 * Extracts a snippet around the first occurrence of `keyword` in `content`.
 */
const getMatchSnippet = (content, keyword, maxLength = 200) => {
  if (!keyword || !content) return null;

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");
  const match = content.match(regex);

  if (!match) return null;

  const matchIndex = match.index;
  const snippetStart = Math.max(0, matchIndex - Math.floor(maxLength / 3));
  const snippetEnd = Math.min(content.length, matchIndex + keyword.length + Math.floor((maxLength * 2) / 3));

  let snippet = content.slice(snippetStart, snippetEnd);
  snippet = snippet.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

  if (snippetStart > 0) snippet = "…" + snippet;
  if (snippetEnd < content.length) snippet = snippet + "…";

  return snippet;
};

const SearchPage = () => {
  const router = useRouter();
  const { query } = router;
  const keyword = query.key;
  const escapedKeyword = keyword?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keywordRegex = escapedKeyword ? new RegExp(escapedKeyword, "i") : null;
  const { posts } = useSearchContext();

  const searchResults = posts
    .filter((product) => {
      if (product.frontmatter.draft) {
        return !product.frontmatter.draft;
      }
      if (!keywordRegex) return false;

      if (keywordRegex.test(product.frontmatter.title)) {
        return true;
      } else if (
        product.frontmatter.categories.find((category) =>
          keywordRegex.test(category)
        )
      ) {
        return true;
      } else if (keywordRegex.test(product.content)) {
        return true;
      }
      return false;
    })
    .map((post) => {
      const contentText = plainify(post.content);
      const snippet = getMatchSnippet(contentText, query.key);

      // If the keyword was found in the content, show the matching snippet
      // instead of the original description, so the user sees *where* it matched.
      const matchedInContent = snippet !== null;

      return {
        ...post,
        frontmatter: {
          ...post.frontmatter,
          description: matchedInContent
            ? snippet
            : post.frontmatter.description,
        },
      };
    });

  const resultsCount = searchResults.length;

  return (
    <Base title={`Результаты поиска ${query.key}`}>
      <div className="section pt-4">
        <div className="container">
          <PageHeader
            badge={
              <>
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                Поиск
              </>
            }
            title={<span className="capitalize">{query.key}</span>}
            meta={resultsCount > 0 && `${resultsCount} ${pluralize(resultsCount, ["результат", "результата", "результатов"])}`}
          />
          {searchResults.length > 0 ? (
            <PostGrid posts={searchResults} highlight={query.key} />
          ) : (
            <EmptyState
              title="Ничего не найдено"
              description="Попробуйте изменить поисковый запрос."
            />
          )}
        </div>
      </div>
    </Base>
  );
};

export default SearchPage;
