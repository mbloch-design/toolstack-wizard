import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createClient } from "@supabase/supabase-js";

const ENV_FILE = process.env.GO26_ENV_FILE || ".env.preprod";
const ROTATE_PASSWORD = process.argv.includes("--rotate") || process.env.GO30_ROTATE_PASSWORD === "true";

function loadEnvFile(path) {
  if (!existsSync(path)) {
    throw new Error(`${path} not found. Create it from .env.preprod.example first.`);
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return { env, lines };
}

function isUsable(value) {
  return Boolean(value && !value.includes("<"));
}

function setEnvValue(state, key, value) {
  const nextLine = `${key}=${value}`;
  const index = state.lines.findIndex((line) => line.startsWith(`${key}=`));
  if (index >= 0) {
    state.lines[index] = nextLine;
  } else {
    state.lines.push(nextLine);
  }
  state.env[key] = value;
}

function ensureEmailInAllowlist(state, email) {
  const current = state.env.BACKOFFICE_ADMIN_EMAILS || "";
  const emails = current
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const normalizedEmail = email.trim().toLowerCase();
  if (!emails.includes(normalizedEmail)) emails.push(normalizedEmail);
  setEnvValue(state, "BACKOFFICE_ADMIN_EMAILS", emails.join(","));
}

function saveEnvFile(path, state) {
  writeFileSync(path, `${state.lines.join("\n").replace(/\n+$/, "")}\n`, { mode: 0o600 });
}

function readSecret(prompt) {
  if (process.platform === "win32") {
    return null;
  }
  const result = spawnSync("bash", ["-lc", `read -r -s -p ${JSON.stringify(prompt)} value; printf '\\n%s' "$value"`], {
    encoding: "utf8",
    stdio: ["inherit", "pipe", "inherit"],
  });
  if (result.status !== 0) return null;
  return result.stdout.replace(/^\n/, "");
}

async function promptMissingValues(state) {
  const rl = readline.createInterface({ input, output });
  try {
    if (!isUsable(state.env.GO30_ADMIN_EMAIL)) {
      const email = (await rl.question("Email admin GO30: ")).trim();
      if (!email) throw new Error("GO30_ADMIN_EMAIL is required.");
      setEnvValue(state, "GO30_ADMIN_EMAIL", email);
    }

    if (ROTATE_PASSWORD) {
      console.log("Rotation du mot de passe admin GO30.");
    }

    if (ROTATE_PASSWORD || !isUsable(state.env.GO30_ADMIN_PASSWORD)) {
      const hiddenPassword = readSecret("Mot de passe admin GO30: ");
      const password = hiddenPassword ?? await rl.question("Mot de passe admin GO30: ");
      if (!password || password.length < 8) {
        throw new Error("GO30_ADMIN_PASSWORD must contain at least 8 characters.");
      }
      setEnvValue(state, "GO30_ADMIN_PASSWORD", password);
    }
  } finally {
    rl.close();
  }
}

async function createAdminUser(state) {
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GO30_ADMIN_EMAIL", "GO30_ADMIN_PASSWORD"];
  const missing = required.filter((key) => !isUsable(state.env[key]));
  if (missing.length > 0) {
    throw new Error(`Missing required env in ${ENV_FILE}: ${missing.join(", ")}`);
  }

  const supabase = createClient(state.env.SUPABASE_URL, state.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const email = state.env.GO30_ADMIN_EMAIL.trim().toLowerCase();
  const password = state.env.GO30_ADMIN_PASSWORD;

  const { data, error } = await supabase.auth.admin.createUser({
    email: state.env.GO30_ADMIN_EMAIL,
    password,
    email_confirm: true,
    user_metadata: {
      source: "tooltrim-go30-backoffice",
    },
  });

  if (error) {
    const message = error.message || String(error);
    if (/already|registered|exists/i.test(message)) {
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (listError) throw new Error(listError.message);

      const user = usersData.users.find((item) => item.email?.trim().toLowerCase() === email);
      if (!user) {
        throw new Error("Admin user already exists, but could not be found to confirm/update it.");
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true,
        user_metadata: {
          ...(user.user_metadata || {}),
          source: "tooltrim-go30-backoffice",
        },
      });
      if (updateError) throw new Error(updateError.message);

      console.log("[OK] Supabase admin user already exists and password is updated");
      return;
    }
    throw new Error(message);
  }

  console.log(`[OK] Supabase admin user ready: ${data.user?.email || state.env.GO30_ADMIN_EMAIL}`);
}

try {
  const state = loadEnvFile(ENV_FILE);
  await promptMissingValues(state);
  ensureEmailInAllowlist(state, state.env.GO30_ADMIN_EMAIL);
  saveEnvFile(ENV_FILE, state);
  await createAdminUser(state);

  console.log("");
  console.log("[OK] .env.preprod updated for GO30");
  console.log("");
  console.log("Next:");
  console.log("npm run deploy:preprod-secrets");
  console.log("npm run deploy:preprod-functions");
  console.log("npm run validate:go30");
} catch (error) {
  console.error("[FAIL] GO30 admin auth setup failed");
  console.error(`     ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
