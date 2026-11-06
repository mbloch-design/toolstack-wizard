import { inject } from "vitest";
import { setProjectAnnotations } from "@storybook/react-vite";
import * as preview from "./preview";

declare module "vitest" {
  export interface ProvidedContext {
    width: 390 | 768 | 1280;
  }
}

// Storybook's Vitest addon sizes the page from the story's viewport global (1200 px when none is set),
// so each project of vitest.ds.config.ts sets the viewport it stands for, from preview.tsx's options.
const viewport = { 390: "phone", 768: "tablet", 1280: "desktop" }[inject("width")];
setProjectAnnotations([preview, { initialGlobals: { viewport: { value: viewport, isRotated: false } } }]);
