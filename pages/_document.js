import TwSizeIndicator from "@components/TwSizeIndicator";
import config from "@config/config.json";
import { Head, Html, Main, NextScript } from "next/document";

const Document = () => {
  // destructuring items from config object
  const { favicon } = config.site;
  return (
    <Html lang="ru">
      <Head>
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
