import ImageFallback from "@components/ImageFallback";
import config from "@config/config.json";
import Link from "next/link";

const Logo = ({ src }) => {
  // destructuring items from config object
  const { logo, logo_white, logo_width, logo_height, logo_text, title } =
    config.site;

  // loading="lazy" + display:none on the hidden variant means the browser
  // only fetches the logo that's actually visible (no double download),
  // while the swap stays purely CSS-driven (no flicker on navigation).
  const imgProps = {
    width: logo_width.replace("px", "") * 2,
    height: logo_height.replace("px", "") * 2,
    alt: title,
    loading: "lazy",
    style: {
      height: logo_height.replace("px", "") + "px",
      width: logo_width.replace("px", "") + "px",
    },
  };

  return (
    <Link href="/" className="navbar-brand">
      {src || logo ? (
        <div className="relative inline-block">
          {/* dark logo — visible in light mode */}
          <ImageFallback
            {...imgProps}
            src={src || logo}
            className={"m-auto block dark:hidden"}
          />
          {/* light logo — visible in dark mode */}
          <ImageFallback
            {...imgProps}
            src={logo_white}
            className={"m-auto hidden dark:block"}
          />
        </div>
      ) : logo_text ? (
        logo_text
      ) : (
        title
      )}
    </Link>
  );
};

export default Logo;
