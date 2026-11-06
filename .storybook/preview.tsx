import type { Decorator, Preview } from "@storybook/react-vite";
import "./fonts.css";
import "../src/ds/tokens.css";

const withEnvironment: Decorator = (Story, context) => {
  const root = document.documentElement;
  root.classList.toggle("dark", context.globals.theme === "dark");
  root.lang = context.globals.lang;
  document.body.style.background = "var(--tt-bg)";
  document.body.style.color = "var(--tt-ink)";
  return <Story />;
};

const preview: Preview = {
  globalTypes: {
    lang: { description: "Langue", toolbar: { icon: "globe", items: [{ value: "fr", title: "Français" }, { value: "en", title: "English" }], dynamicTitle: true } },
    theme: { description: "Thème", toolbar: { icon: "mirror", items: [{ value: "light", title: "Clair" }, { value: "dark", title: "Sombre" }], dynamicTitle: true } },
  },
  initialGlobals: { lang: "fr", theme: "light" },
  decorators: [withEnvironment],
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
    viewport: {
      options: {
        phone: { name: "390", styles: { width: "390px", height: "844px" } },
        tablet: { name: "768", styles: { width: "768px", height: "1024px" } },
        desktop: { name: "1280", styles: { width: "1280px", height: "900px" } },
      },
    },
  },
};
export default preview;
