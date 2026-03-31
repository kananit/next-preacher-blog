import config from "@config/config.json";
import GeneratedCover from "@layouts/components/GeneratedCover";
import dateFormat from "@lib/utils/dateFormat";
import { plainify, slugify } from "@lib/utils/textConverter";
import Link from "next/link";
import { FaRegCalendar, FaUserAlt } from "react-icons/fa";

const Post = ({ post }) => {
  const { summary_length, blog_folder } = config.settings;
  const { meta_author } = config.metadata;
  const excerpt = plainify(post.frontmatter.description || post.content) || "";
  const author = post.frontmatter.author
    ? post.frontmatter.author
    : meta_author;
  return (
    <div className="post">
      <div className="relative">
        <GeneratedCover post={post} />
        <ul className="absolute left-2 top-3 flex flex-wrap items-center gap-y-2">
          {post.frontmatter.categories.map((tag, index) => (
            <li
              className="mx-1 inline-flex h-7 rounded-[35px] bg-primary px-3 text-white sm:mx-1.5"
              key={"tag-" + index}
            >
              <Link className="capitalize" href={`/categories/${slugify(tag)}`}>
                {tag}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <h3 className="h5 mb-2 mt-4">
        <Link
          href={`/${blog_folder}/${post.slug}`}
          className="block hover:text-primary"
        >
          {post.frontmatter.title}
        </Link>
      </h3>
      <ul className="flex items-center space-x-4">
        <li>
          <Link
            className="inline-flex items-center font-secondary text-xs leading-3"
            href="/about"
          >
            <FaUserAlt className="mr-1.5" />
            {author}
          </Link>
        </li>
        <li className="inline-flex items-center font-secondary text-xs leading-3">
          <FaRegCalendar className="mr-1.5" />
          {dateFormat(post.frontmatter.date)}
        </li>
      </ul>
      <p>{excerpt.slice(0, Number(summary_length))}</p>
      <Link
        className="btn btn-outline-primary mt-4"
        href={`/${blog_folder}/${post.slug}`}
      >
        Читать
      </Link>
    </div>
  );
};

export default Post;
