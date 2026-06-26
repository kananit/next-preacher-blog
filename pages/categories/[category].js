import PageHeader from "@layouts/components/PageHeader";
import PostGrid from "@layouts/components/PostGrid";
import EmptyState from "@layouts/components/EmptyState";
import Pagination from "@layouts/components/Pagination";
import pluralize from "@lib/utils/pluralize";
import Base from "@layouts/Baseof";
import { getSinglePage } from "@lib/contentParser";
import { getTaxonomyMeta } from "@lib/taxonomyParser";
import { slugify, stripContent } from "@lib/utils/textConverter";
import { useRouter } from "next/router";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { getSectionIds, getSectionMeta } from "@config/sections";
import config from "@config/config.json";

// category page
const Category = ({ postsByCategories, categoryLabel, defaultSectionId }) => {
  const router = useRouter();
  const sectionId = router.query.section || defaultSectionId;
  const filteredPosts = postsByCategories.filter(
    (p) => !p._section || p._section === sectionId
  );
  const postsCount = filteredPosts.length;
  const section = getSectionMeta(sectionId);
  const SectionIcon = section.icon;

  // Client-side pagination
  const { pagination } = config.settings;
  const currentPage = parseInt(router.query.page, 10) || 1;
  const totalPages = Math.ceil(filteredPosts.length / pagination);
  const indexOfLastPost = currentPage * pagination;
  const indexOfFirstPost = indexOfLastPost - pagination;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  // Build pagination URLs with category slug and section query param
  const formatPageLink = (page) => {
    const params = new URLSearchParams();
    if (sectionId !== defaultSectionId) params.set("section", sectionId);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return `/categories/${router.query.category}${qs ? `?${qs}` : ""}`;
  };

  return (
    <Base title={categoryLabel}>
      <div className="section pt-4">
        <div className="container">
          {/* Back link */}
          <Link
            href={`/categories?section=${sectionId}`}
            className={`mb-4 inline-flex items-center gap-1.5 text-sm font-medium transition ${section.linkColor}`}
          >
            <FaArrowLeft className="text-xs" />
            <SectionIcon className="text-xs" />
            {section.name}
          </Link>

          <PageHeader
            badge={
              <>
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zm6-6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Категория
              </>
            }
            title={<span className="capitalize">{categoryLabel}</span>}
            meta={postsCount === 0 ? "нет записей" : `${postsCount} ${pluralize(postsCount, ["запись", "записи", "записей"])}`}
          />

          {currentPosts.length > 0 ? (
            <>
              <PostGrid posts={currentPosts} section={sectionId} />
              <Pagination
                section={sectionId}
                currentPage={currentPage}
                totalPages={totalPages}
                formatPageLink={formatPageLink}
              />
            </>
          ) : (
            <EmptyState
              icon={
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              }
              title="Здесь пока пусто"
              description="В этой категории ещё нет записей. Попробуйте заглянуть в другие рубрики."
            />
          )}
        </div>
      </div>
    </Base>
  );
};

export default Category;

// category page routes — collect from ALL sections
export const getStaticPaths = () => {
  const sectionIds = getSectionIds();

  const paths = sectionIds.flatMap((sectionId) => {
    const folder = `content/${sectionId}`;
    const allCategories = getTaxonomyMeta(folder, "categories");
    return allCategories.map((category) => ({
      params: {
        category: category.slug,
      },
    }));
  });

  return { paths, fallback: false };
};

// category page data — loads posts from all sections, filtering is done client-side
export const getStaticProps = ({ params }) => {
  const { category } = params;

  // Load posts from all sections (without content body)
  const allSections = getSectionIds().map((id) => ({
    id,
    posts: stripContent(getSinglePage(`content/${id}`)),
  }));

  // Find which section(s) have this category
  const sectionsWithCategory = allSections.filter(({ posts }) =>
    posts.some((post) =>
      post.frontmatter.categories
        ?.map((e) => slugify(e))
        .includes(category)
    )
  );

  // Default section: prefer the first one that has this category
  const defaultSectionId = sectionsWithCategory[0]?.id || "posts";

  // Collect all posts matching this category from all sections
  const allMatchingPosts = allSections.flatMap(({ id, posts }) =>
    posts
      .filter((post) =>
        post.frontmatter.categories
          ?.map((e) => slugify(e))
          .includes(category)
      )
      .map((post) => ({
        ...post,
        _section: id, // tag each post with its section
      }))
  );

  // Get category label from the default section
  const categories = getTaxonomyMeta(
    `content/${defaultSectionId}`,
    "categories"
  );
  const activeCategory = categories.find(
    (cat) => cat.slug === category
  );

  return {
    props: {
      postsByCategories: allMatchingPosts,
      categoryLabel: activeCategory?.label || category,
      defaultSectionId,
    },
  };
};
