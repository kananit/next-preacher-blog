import Base from "@layouts/Baseof";
import { getCategoriesWithCount } from "@lib/taxonomyParser";
import { getSinglePage } from "@lib/contentParser";
import { markdownify } from "@lib/utils/textConverter";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaFire, FaFolder, FaStar } from "react-icons/fa";
import SECTIONS, { getSectionIds } from "@config/sections";

const SectionTab = ({ section, isActive, onClick }) => {
  const Icon = section.icon;
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200 ${
        isActive
          ? "bg-primary text-white shadow-lg shadow-primary/20 dark:bg-primary dark:text-white"
          : "bg-theme-light text-dark hover:bg-primary/10 dark:bg-darkmode-theme-dark dark:text-darkmode-light dark:hover:bg-primary/10"
      }`}
    >
      <Icon
        className={`text-lg ${
          isActive ? "text-white" : "text-primary"
        }`}
      />
      <span>{section.name}</span>
    </button>
  );
};

const Categories = ({ sectionsData }) => {
  const router = useRouter();
  const activeSectionId = router.query.section || "posts";

  // Merge static defs with server data
  const sections = SECTIONS.map((def) => ({
    ...def,
    ...(sectionsData.find((s) => s.id === def.id) || {}),
  }));

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];

  const switchSection = (sectionId) => {
    router.push(
      {
        pathname: "/categories",
        query: { section: sectionId },
      },
      undefined,
      { shallow: true }
    );
  };

  const allCategories = activeSection.categories || [];

  // Все категории в одном списке: сначала основные (primary), потом остальные,
  // внутри каждой группы сортировка по количеству постов
  const sortedCategories = [
    ...allCategories.filter((c) => c.isPrimary).sort((a, b) => b.posts - a.posts),
    ...allCategories.filter((c) => !c.isPrimary).sort((a, b) => b.posts - a.posts),
  ];

  const totalPosts = activeSection.totalPosts || 0;

  return (
    <Base title={"Категории"}>
      <section className="section pt-0">
        {markdownify(
          "Категории",
          "h1",
          "h2 lg:mb-4 bg-theme-light dark:bg-darkmode-theme-dark py-8 sm:py-12 text-center lg:text-[55px]"
        )}

        <div className="container pt-8">
          {/* Section Switcher */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex flex-nowrap items-center gap-3 rounded-2xl bg-theme-light p-2 dark:bg-darkmode-theme-dark">
              {sections.map((section) => (
                <SectionTab
                  key={section.id}
                  section={section}
                  isActive={activeSectionId === section.id}
                  onClick={() => switchSection(section.id)}
                />
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="mb-10 text-lg text-text dark:text-darkmode-text">
              Рубрики раздела «{activeSection.name}» — {totalPosts}{" "}
              {totalPosts === 1 ? "запись" : totalPosts > 4 ? "записей" : "записи"}{" "}
              в {activeSection.categories?.length || 0}{" "}
              {(activeSection.categories?.length || 0) === 1
                ? "категории"
                : "категориях"}
            </p>

            {sortedCategories.length > 0 ? (
              <ul className="row">
                {sortedCategories.map((category, i) => {
                  const isPrimary = category.isPrimary;
                  const isTop = i === 0;

                  return (
                    <li
                      key={`category-${i}`}
                      className="mt-4 block lg:col-4 xl:col-3"
                    >
                      <Link
                        href={`/categories/${category.slug}?section=${activeSectionId}`}
                        className={`flex w-full items-center justify-center rounded-lg px-4 py-4 font-bold text-dark transition hover:bg-primary hover:text-white dark:text-darkmode-light dark:hover:bg-primary dark:hover:text-white ${
                          isPrimary
                            ? isTop
                              ? "bg-primary/10 ring-2 ring-primary/30 dark:bg-darkmode-theme-dark"
                              : "bg-primary/[0.07] ring-1 ring-primary/15 dark:bg-darkmode-theme-dark"
                            : "bg-theme-light dark:bg-darkmode-theme-dark"
                        }`}
                      >
                        {isPrimary ? (
                          <FaStar className="mr-1.5 text-primary" />
                        ) : (
                          <FaFolder className="mr-1.5" />
                        )}
                        {category.label}
                        <span
                          className={`ml-2 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isTop && isPrimary
                              ? "bg-primary text-white"
                              : "bg-white text-dark dark:bg-darkmode-border dark:text-darkmode-light"
                          }`}
                        >
                          {isTop && isPrimary && <FaFire className="text-[10px]" />}
                          {category.posts}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed border-border py-16 dark:border-darkmode-border">
                <p className="text-lg text-text dark:text-darkmode-text">
                  В этом разделе пока нет категорий
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </Base>
  );
};

export default Categories;

export const getStaticProps = () => {
  const sectionIds = getSectionIds();

  const sectionsData = sectionIds.map((id) => {
    const folder = `content/${id}`;
    const posts = getSinglePage(folder);
    const categories = getCategoriesWithCount(folder);
    return {
      id,
      categories,
      totalPosts: posts.length,
    };
  });

  return {
    props: {
      sectionsData,
    },
  };
};
