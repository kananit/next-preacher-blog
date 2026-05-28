import { markdownify } from "@lib/utils/textConverter";
import Link from "next/link";

const NotFound = ({ data }) => {
  const { frontmatter, content } = data;

  return (
    <section className="section">
      <div className="container">
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <h1 className="text-[120px] font-bold leading-none text-primary md:text-[180px]">
              404
            </h1>
            <h2 className="mb-6 text-xl md:text-2xl">{frontmatter.title}</h2>
            <p className="mb-8 text-text dark:text-darkmode-text">
              Страница, которую вы ищете, не существует или была перемещена.
            </p>
            <Link href="/" className="btn btn-primary">
              На главную
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
