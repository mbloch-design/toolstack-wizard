import { createContext, useContext } from "react";
import { Lang } from "@/data/types";

interface LangContextType {
  lang: Lang;
  t: (fr: string, en: string) => string;
  prefix: string;
}

export const LangContext = createContext<LangContextType>({
  lang: "fr",
  t: (fr) => fr,
  prefix: "/fr",
});

export const useLang = () => useContext(LangContext);
