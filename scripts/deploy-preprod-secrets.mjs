import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const PROJECT_REF = "rtfyfuwfdpnsogovkwai";
const SUPABASE_BIN = process.env.SUPABASE_CLI || "supabase";
const REQUIRED_SECRETS = [
  "BACKOFFICE_ADMIN_KEY",
  "BACKOFFICE_ALERT_WORKER_KEY",
  "DIAGNOSTIC_EMAIL_WORKER_KEY",
];
const OPTIONAL_SECRETS = [
  "DIAGNOSTIC_EMAIL_WEBHOOK_KEY",
  "RESEND_API_KEY",
  "RESEND_WEBHOOK_SECRET",
  "DIAGNOSTIC_EMAIL_FROM",
  "BACKOFFICE_ALERT_EMAILS",
  "TOOLTRIM_APP_URL",
];

function loadEnv(path = ".env.preprod") {
  if (!existsSync(path)) {
    throw new Error(`${path} not found.`);
  }

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

function hasValue(value) {
  return Boolean(value && !value.includes("<"));
}

function runSupabase(args, env) {
  let result = spawnSync(SUPABASE_BIN, args, { stdio: "inherit", env });

  if (result.error?.code === "ENOENT" && !process.env.SUPABASE_CLI) {
    console.log("Local supabase CLI not found, falling back to npx supabase@latest.");
    result = spawnSync("npx", ["--yes", "supabase@latest", ...args], { stdio: "inherit", env });
  }

  if (result.status !== 0) process.exit(result.status || 1);
}

const envFile = loadEnv();
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || envFile.SUPABASE_ACCESS_TOKEN;
if (!hasValue(accessToken)) {
  console.error("Missing SUPABASE_ACCESS_TOKEN in .env.preprod.");
  process.exit(1);
}

const missing = REQUIRED_SECRETS.filter((key) => !hasValue(envFile[key]));
if (missing.length) {
  console.error(`Missing required secrets in .env.preprod: ${missing.join(", ")}`);
  process.exit(1);
}

const keys = [
  ...REQUIRED_SECRETS,
  ...OPTIONAL_SECRETS.filter((key) => hasValue(envFile[key])),
];

const tempEnvPath = join(tmpdir(), `tooltrim-preprod-secrets-${process.pid}.env`);
const tempBody = keys.map((key) => `${key}=${envFile[key]}`).join("\n");
writeFileSync(tempEnvPath, `${tempBody}\n`, { mode: 0o600 });

try {
  console.log(`Pushing Supabase Edge Function secrets to ${PROJECT_REF}:`);
  for (const key of keys) console.log(`- ${key}`);
  console.log("");

  runSupabase(["secrets", "set", "--project-ref", PROJECT_REF, "--env-file", tempEnvPath], {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: accessToken,
  });

  console.log("");
  console.log("Supabase Edge Function secrets pushed. Now run: npm run validate:preprod");
} finally {
  rmSync(tempEnvPath, { force: true });
}
