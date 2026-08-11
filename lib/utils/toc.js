import GithubSlugger from "github-slugger";

// Извлекает заголовки второго уровня (##) из markdown-контента
// и генерирует якоря теми же правилами, что rehype-slug (github-slugger),
// чтобы ссылки оглавления совпадали с id заголовков в отрендеренном MDX.
export const extractToc = (content) => {
  const slugger = new GithubSlugger();
  const toc = [];
  const lines = (content || "").split("\n");
  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      const text = match[1].trim();
      // Пропускаем раздел «Содержание» — он дублирует наше оглавление
      if (/^содержание$/i.test(text)) continue;
      toc.push({ text, id: slugger.slug(text) });
    }
  }
  return toc;
};
