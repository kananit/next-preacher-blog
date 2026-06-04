import PageHeader from "@layouts/components/PageHeader";
import PostGrid from "@layouts/components/PostGrid";
import EmptyState from "@layouts/components/EmptyState";
import pluralize from "@lib/utils/pluralize";
import config from "@config/config.json";
import Base from "@layouts/Baseof";
import { getSinglePage } from "@lib/contentParser";
import { getTaxonomyMeta } from "@lib/taxonomyParser";
import { slugify } from "@lib/utils/textConverter";
import { useRouter } from "next/router";
import Link from "next/link";
import { FaArrowLeft, FaBook, FaBookOpen } from "react-icons/fa";
const { blog_folder } = config.settings;

// Section metadata (keep in sync with categories/index.js)
const SECTION_META = {
  posts: {
    name: "Проповеди",
    icon: FaBook,
    iconClass: "text-primary",
    linkColor: "text-primary hover:text-primary/80",
  },
  notes: {
    name: "Конспекты",
    icon: FaBookOpen,
    iconClass: "text-primary",
    linkColor: "text-primary hover:text-primary/80",
  },
};

// category page
const Category = ({ postsByCategories, categoryLabel, defaultSectionId }) => {
  const router = useRouter();
  const sectionId = router.query.section || defaultSectionId;
  const filteredPosts = postsByCategories.filter(
    (p) => !p._section || p._section === sectionId
  );
  const postsCount = filteredPosts.length;
  const section = SECTION_META[sectionId] || SECTION_META["posts"];
  const SectionIcon = section.icon;

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

          {filteredPosts.length > 0 ? (
            <PostGrid posts={filteredPosts} section={sectionId} />
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
  const sectionIds = ["posts", "notes"];

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

  // Load posts from all sections
  const allSections = [
    { id: "posts", posts: getSinglePage(`content/posts`) },
    { id: "notes", posts: getSinglePage(`content/notes`) },
  ];

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
