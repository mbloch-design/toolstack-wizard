import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: { name: "@storybook/react-vite", options: { builder: { viteConfigPath: ".storybook/vite.config.ts" } } },
  stories: ["../src/ds/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest", "@storybook/addon-mcp"],
  staticDirs: [
    { from: "../public/fonts", to: "/fonts" },
    { from: "../public/home-logos", to: "/home-logos" },
    { from: "../public/og-screenshots", to: "/og-screenshots" },
    { from: "../public/assets", to: "/assets" },
    { from: "../node_modules/@fontsource-variable/inter/files", to: "/fonts/inter" },
    { from: "../node_modules/@fontsource-variable/inter-tight/files", to: "/fonts/inter-tight" },
  ],
  core: { disableTelemetry: true },
};
export default config;
