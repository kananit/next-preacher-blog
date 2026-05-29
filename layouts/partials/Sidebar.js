import config from "@config/config.json";
import GeneratedCover from "@layouts/components/GeneratedCover";
import dateFormat from "@lib/utils/dateFormat";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaRegCalendar } from "react-icons/fa";
const { blog_folder } = config.settings;

const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Sidebar = ({ posts, className }) => {
  const [randomPosts, setRandomPosts] = useState([]);

  useEffect(() => {
    setRandomPosts(shuffleArray(posts).slice(0, 7));
  }, [posts]);

  return (
    <aside className={`${className || ""} flex flex-col px-0 lg:col-4 lg:px-6`}>
      <div className="flex flex-1 flex-col lg:sticky lg:top-8">
      {/* random posts widget */}
      {randomPosts.length > 0 && (
        <div className="flex flex-1 flex-col rounded border border-border p-6 dark:border-darkmode-border">
          <h4 className="section-title mb-8 text-center">Рекомендуем</h4>
          <div className="flex flex-1 flex-col justify-between">
          {randomPosts.flatMap((post, i) => [
            <div
              key={post.slug}
              className="flex items-center"
            >
              <div className="mr-4 h-[72px] w-[8px] min-w-[8px] max-w-[8px] shrink-0 basis-[8px] overflow-hidden rounded-full">
                <GeneratedCover
                  post={post}
                  mode="stripe-only"
                  className="h-full min-h-0 w-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="h6 mb-1">
                  <Link
                    href={`/${blog_folder}/${post.slug}`}
                    className="block hover:text-primary"
                  >
                    {post.frontmatter.title}
                  </Link>
                </h3>
                <p className="inline-flex items-center font-secondary text-xs">
                  <FaRegCalendar className="mr-1.5" />
                  {dateFormat(post.frontmatter.date)}
                </p>
              </div>
            </div>,
            ...(i < randomPosts.length - 1
              ? [<hr key={`hr-${post.slug}`} className="w-full border-border dark:border-darkmode-border" />]
              : []),
          ])}
          </div>
        </div>
      )}

    </div>
    </aside>
  );
};

export default Sidebar;
