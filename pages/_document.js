import TwSizeIndicator from "@components/TwSizeIndicator";
import config from "@config/config.json";
import theme from "@config/theme.json";
import { Head, Html, Main, NextScript } from "next/document";

const Document = () => {
  // destructuring items from config object
  const { favicon } = config.site;

  // build google fonts url from theme config (loaded in SSR head to avoid FOUC)
  const pf = theme.fonts.font_family.primary;
  const sf = theme.fonts.font_family.secondary;
  const fontUrl = `https://fonts.googleapis.com/css2?family=${pf}${
    sf ? "&family=" + sf : ""
  }&display=swap`;

  return (
    <Html lang="ru" data-scroll-behavior="smooth">
      <Head>
        {/* google fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link rel="stylesheet" href={fontUrl} />
        {/* favicon */}
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="96x96" href={favicon} />
        <link rel="apple-touch-icon" href={favicon} />
        {/* theme meta */}
        <meta name="theme-name" content="geeky-nextjs" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="theme-color" content="#f7f7f7" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var meta = document.querySelector('meta[name="theme-color"]');
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  meta.setAttribute('content', '#191919');
                }
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <TwSizeIndicator />
        <NextScript />
      </body>
    </Html>
  );
};

export default Document;
