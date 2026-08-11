import SectionHeading from "@layouts/components/SectionHeading";

// Оглавление поста: нумерованный список разделов с якорями.
// Ведущая цифра из текста заголовка убирается ("1. Текст" → "Текст"),
// т.к. номер уже показывает зелёный авто-счётчик.
const TableOfContents = ({ toc }) => {
  if (!toc || toc.length === 0) return null;

  return (
    <nav className="mb-8">
      <SectionHeading>Содержание</SectionHeading>
      <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
        {toc.map((item, i) => {
          const cleanText = item.text.replace(/^\d+[.)\s]+\s*/, "");
          return (
            <li key={i}>
              <a
                href={`#${item.id}`}
                className="group relative flex items-baseline gap-2.5 text-sm text-text transition-colors hover:text-primary dark:text-darkmode-text dark:hover:text-primary"
              >
                <span className="text-xs font-bold tabular-nums text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="relative leading-snug">
                  {cleanText}
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-primary/40 transition-transform duration-200 group-hover:scale-x-100"
                  />
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default TableOfContents;
