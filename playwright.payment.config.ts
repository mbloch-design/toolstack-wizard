import { defineConfig } from "@playwright/test";
import hydration from "./playwright.hydration.config";

export default defineConfig({
  ...hydration,
  testMatch: "**/submit-payment.spec.ts",
  outputDir: "payment-test-results",
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "payment-report" }]] : "list",
});
