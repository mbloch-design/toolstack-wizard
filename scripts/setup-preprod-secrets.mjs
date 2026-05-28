import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const ENV_FILE = process.env.GO26_ENV_FILE || ".env.preprod";

const GROUPS = {
  supabase: {
    title: "Supabase Edge Function secrets",
    dashboard(env) {
      const ref = env.VITE_SUPABASE_PROJECT_ID || "<project-ref>";
      return `https://supabase.com/dashboard/project/${ref}/functions/secrets`;
    },
    intro: [
      "Open the Supabase URL below.",
      "If the direct page changes, use: Edge Functions > Secrets.",
      "Click Add secret, paste Name, paste Value, then Save.",
    ],
    keys: [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "BACKOFFICE_ADMIN_KEY",
      "BACKOFFICE_ALERT_WORKER_KEY",
      "DIAGNOSTIC_EMAIL_WORKER_KEY",
    ],
    optionalKeys: [
      "RESEND_API_KEY",
      "DIAGNOSTIC_EMAIL_FROM",
      "DIAGNOSTIC_EMAIL_WEBHOOK_KEY",
      "RESEND_WEBHOOK_SECRET",
      "TOOLTRIM_APP_URL",
    ],
  },
  vercel: {
    title: "Vercel Preview environment variables",
    dashboard() {
      return "Open Vercel > ToolTrim project > Settings > Environment Variables";
    },
    intro: [
      "Create each variable in the Preview environment.",
      "If Vercel asks for a branch, choose the preprod/codex branch used for the preprod deployment.",
      "After adding them, redeploy the preprod deployment so the frontend is rebuilt with these values.",
    ],
    keys: [
      "VITE_SUPABASE_URL",
      "VITE_SUPABASE_PROJECT_ID",
      "VITE_SUPABASE_PUBLISHABLE_KEY",
      "PREPROD_APP_URL",
      "TOOLTRIM_APP_URL",
    ],
    optionalKeys: [],
  },
};

function loadEnvFile(path) {
  if (!existsSync(path)) {
    throw new Error(`${path} not found. Create it from .env.preprod.example first.`);
  }

  const env = {};
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
  return env;
}

function isUsable(value) {
  return Boolean(value && !value.includes("<"));
}

function mask(value) {
  if (!value) return "<missing>";
  if (value.length <= 12) return "*".repeat(value.length);
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function copyToClipboard(text) {
  if (process.platform !== "darwin") return false;
  const result = spawnSync("pbcopy", { input: text, encoding: "utf8" });
  return result.status === 0;
}

async function waitForEnter(rl, prompt) {
  await rl.question(`${prompt}\nPress Enter when ready... `);
}

async function runGroup(name, env, rl) {
  const group = GROUPS[name];
  console.log("");
  console.log(`=== ${group.title} ===`);
  console.log(group.dashboard(env));
  console.log("");
  for (const line of group.intro) console.log(`- ${line}`);

  const missing = group.keys.filter((key) => !isUsable(env[key]));
  if (missing.length) {
    console.log("");
    console.log(`Missing required values in ${ENV_FILE}: ${missing.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  await waitForEnter(rl, "Open the dashboard page above.");

  for (const key of group.keys) {
    const value = env[key];
    console.log("");
    console.log(`Name:  ${key}`);
    console.log(`Value: ${mask(value)}`);
    copyToClipboard(key);
    await waitForEnter(rl, "The NAME has been copied. Paste it in the Name/Key field.");
    copyToClipboard(value);
    await waitForEnter(rl, "The VALUE has been copied. Paste it in the Value field, then save/add it.");
  }

  const availableOptional = group.optionalKeys.filter((key) => isUsable(env[key]));
  if (availableOptional.length) {
    console.log("");
    const answer = await rl.question(`Optional values available: ${availableOptional.join(", ")}. Add them too? (y/N) `);
    if (answer.trim().toLowerCase() === "y") {
      for (const key of availableOptional) {
        const value = env[key];
        console.log("");
        console.log(`Name:  ${key}`);
        console.log(`Value: ${mask(value)}`);
        copyToClipboard(key);
        await waitForEnter(rl, "The NAME has been copied. Paste it in the Name/Key field.");
        copyToClipboard(value);
        await waitForEnter(rl, "The VALUE has been copied. Paste it in the Value field, then save/add it.");
      }
    }
  }
}

const mode = process.argv[2] || "all";
if (!["all", "supabase", "vercel"].includes(mode)) {
  console.error("Usage: node scripts/setup-preprod-secrets.mjs [all|supabase|vercel]");
  process.exit(1);
}

const env = loadEnvFile(ENV_FILE);
const rl = readline.createInterface({ input, output });

try {
  if (mode === "all" || mode === "supabase") await runGroup("supabase", env, rl);
  if (mode === "all" || mode === "vercel") await runGroup("vercel", env, rl);
  console.log("");
  console.log("Done. Now run: npm run validate:preprod");
} finally {
  rl.close();
}
