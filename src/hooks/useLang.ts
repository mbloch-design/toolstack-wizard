import { createContext, useContext } from "react";
import { Lang } from "@/data/types";

interface LangContextType {
  lang: Lang;
  t: (fr: string, en: string) => string;
  prefix: string;
}

const segmentLang = typeof window !== "undefined"
  ? (window.location.pathname.split("/")[1] as string)
  : "fr";
const defaultLang: Lang = segmentLang === "en" ? "en" : "fr";

export const LangContext = createContext<LangContextType>({
  lang: defaultLang,
  t: (fr, en) => (defaultLang === "en" ? en : fr),
  prefix: `/${defaultLang}`,
});

export const useLang = () => useContext(LangContext);
