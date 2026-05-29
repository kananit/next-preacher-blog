import { markdownify } from "@lib/utils/textConverter";
import shortcodes from "@shortcodes/all";
import { MDXRemote } from "next-mdx-remote";
import Image from "next/image";

const About = ({ data }) => {
  const { frontmatter, mdxContent } = data;
  const { title, image } = frontmatter;

  return (
    <section className="section pt-0">
      {markdownify(
        title,
        "h1",
        "h2 lg:mb-4 bg-theme-light dark:bg-darkmode-theme-dark py-8 sm:py-12 text-center lg:text-[55px]"
      )}
      <div className="container text-left">
        {image && (
          <div className="mb-8">
            <Image
              src={image}
              width={1298}
              height={616}
              alt={title}
              className="rounded-lg"
              priority={true}
            />
          </div>
        )}

        <div className="content">
          <MDXRemote {...mdxContent} components={shortcodes} />
        </div>
      </div>
    </section>
  );
};

export default About;
