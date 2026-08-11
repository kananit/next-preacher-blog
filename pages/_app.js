import config from "@config/config.json";
import { JsonContext } from "context/state";
import { ThemeProvider, useTheme } from "next-themes";
import Head from "next/head";
import { useEffect } from "react";
import TagManager from "react-gtm-module";
import YandexMetrika from "@layouts/components/YandexMetrika";
import "styles/style.scss";

const THEME_COLORS = {
  light: "#f7f7f7",
  dark: "#191919",
};

/** Updates the theme-color meta tag based on the current theme. */
const ThemeColorUpdater = () => {
  const { theme, resolvedTheme } = useTheme();
  const activeTheme = theme === "system" ? resolvedTheme : theme;

  useEffect(() => {
    const color = THEME_COLORS[activeTheme] || THEME_COLORS.light;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", color);
    }
  }, [activeTheme]);

  return null;
};

const App = ({ Component, pageProps }) => {
  // default theme setup
  const { default_theme } = config.settings;

  // google tag manager (gtm)
  const tagManagerArgs = {
    gtmId: config.params.tag_manager_id,
  };
  useEffect(() => {
    setTimeout(() => {
      process.env.NODE_ENV === "production" &&
        config.params.tag_manager_id &&
        TagManager.initialize(tagManagerArgs);
    }, 5000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <YandexMetrika counterId={config.params.yandex_metrika_id} />
      <JsonContext>
        <Head>
          {/* responsive meta */}
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=5"
          />
          {/* yandex webmaster verification */}
          <meta name="yandex-verification" content="a8e801bca5e46df2" />
        </Head>
        <ThemeProvider
          attribute="class"
          defaultTheme={default_theme}
          enableSystem={true}
        >
          <ThemeColorUpdater />
          <Component {...pageProps} />
        </ThemeProvider>
      </JsonContext>
    </>
  );
};

export default App;
