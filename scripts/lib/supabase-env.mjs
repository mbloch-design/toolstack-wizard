import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnvFile(path) {
  const env = {};
  let content;
  try { content = readFileSync(path, "utf8"); } catch { return env; }
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const fileEnv = {
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.local"),
  ...loadEnvFile(".env.preprod"),
  ...loadEnvFile(".env.production"),
};

const pick = (...names) => names.map((n) => process.env[n] || fileEnv[n]).find(Boolean);

export const SUPABASE_URL = pick("SUPABASE_URL", "VITE_SUPABASE_URL") || "https://rtfyfuwfdpnsogovkwai.supabase.co";
export const SERVICE_KEY = pick("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY", "SERVICE_ROLE_KEY");

export const supabase = SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  : null;
