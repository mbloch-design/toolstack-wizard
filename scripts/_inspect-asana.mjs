import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const fileEnv = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local"), ...loadEnvFile(".env.preprod") };
const get = (...names) => names.map(n => process.env[n] || fileEnv[n]).find(Boolean);

const SUPABASE_URL = get("SUPABASE_URL", "VITE_SUPABASE_URL");
const SUPABASE_KEY = get("SUPABASE_SERVICE_ROLE_KEY", "SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const { data, error } = await supabase.from("tools").select("*").eq("slug", "asana").maybeSingle();
if (error) { console.error("ERR", error.message); process.exit(1); }
console.log(JSON.stringify(data, null, 2));
