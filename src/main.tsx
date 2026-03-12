// Polyfill critique pour Supabase
if (typeof Object.hasOwn !== "function") {
  Object.hasOwn = (obj: any, prop: string | symbol | number) => Object.prototype.hasOwnProperty.call(obj, prop);
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
