import config from "@config/config.json";
import { IoLogoVk, IoPaperPlane } from "react-icons/io5";

const Share = ({ title, description, slug, className }) => {
  // destructuring items from config object
  const { base_url } = config.site;
  const url = `${base_url}/${slug}`;

  return (
    <ul className={`flex items-center gap-3 ${className}`}>
      <li>
        <a
          aria-label="Поделиться ВКонтакте"
          title="ВКонтакте"
          href={`https://vk.com/share.php?url=${encodeURIComponent(
            url,
          )}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(
            description,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15 transition hover:bg-primary hover:text-white hover:ring-primary dark:bg-primary/15"
        >
          <IoLogoVk className="text-lg" />
        </a>
      </li>
      <li>
        <a
          aria-label="Поделиться в Telegram"
          title="Telegram"
          href={`https://t.me/share/url?url=${encodeURIComponent(
            url,
          )}&text=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15 transition hover:bg-primary hover:text-white hover:ring-primary dark:bg-primary/15"
        >
          <IoPaperPlane className="text-lg" />
        </a>
      </li>
    </ul>
  );
};

export default Share;
