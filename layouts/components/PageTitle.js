import { markdownify } from "@lib/utils/textConverter";

// Большая плашка-заголовок страницы (Категории, Инфо и т.д.)
const PageTitle = ({ title }) => {
  return (
    <div className="border-b border-border bg-theme-light/60 py-8 text-center dark:border-darkmode-border dark:bg-darkmode-theme-dark/60 sm:py-10">
      <h1 className="mx-auto max-w-3xl px-4 text-[42px] font-bold leading-tight tracking-tight text-dark dark:text-darkmode-light sm:text-[52px]">
        {markdownify(title)}
      </h1>
      <span
        className="mx-auto mt-3 block h-1 w-16 rounded-full bg-primary"
        aria-hidden="true"
      />
    </div>
  );
};

export default PageTitle;
