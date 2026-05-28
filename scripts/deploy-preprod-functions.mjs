import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const PROJECT_REF = "rtfyfuwfdpnsogovkwai";
const FUNCTIONS = [
  "backoffice-diagnostic",
  "send-backoffice-alerts",
  "process-diagnostic-email-jobs",
];
const SUPABASE_BIN = process.env.SUPABASE_CLI || "supabase";

function loadEnv(path = ".env.preprod") {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}

function runSupabase(args, env) {
  console.log("");
  console.log(`${SUPABASE_BIN} ${args.join(" ")}`);
  let result = spawnSync(SUPABASE_BIN, args, { stdio: "inherit", env });

  if (result.error?.code === "ENOENT" && !process.env.SUPABASE_CLI) {
    console.log("Local supabase CLI not found, falling back to npx supabase@latest.");
    result = spawnSync("npx", ["--yes", "supabase@latest", ...args], { stdio: "inherit", env });
  }

  if (result.status !== 0) process.exit(result.status || 1);
}

const fileEnv = loadEnv();
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || fileEnv.SUPABASE_ACCESS_TOKEN;

if (!accessToken) {
  console.error("Missing SUPABASE_ACCESS_TOKEN in .env.preprod.");
  process.exit(1);
}

const env = {
  ...process.env,
  SUPABASE_ACCESS_TOKEN: accessToken,
};

for (const fn of FUNCTIONS) {
  runSupabase([
    "functions",
    "deploy",
    fn,
    "--project-ref",
    PROJECT_REF,
    "--no-verify-jwt",
    "--use-api",
  ], env);
}

console.log("");
console.log("Preprod Edge Functions deployed. Now run: npm run validate:preprod");
