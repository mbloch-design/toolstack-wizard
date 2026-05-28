import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

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

function run(label, args, options = {}) {
  console.log("");
  console.log(`=== ${label} ===`);
  console.log(`${SUPABASE_BIN} ${args.join(" ")}`);

  let result = spawnSync(SUPABASE_BIN, args, {
    stdio: "inherit",
    env: { ...process.env, ...options.env },
  });

  if (result.error?.code === "ENOENT" && !process.env.SUPABASE_CLI) {
    console.log("Local supabase CLI not found, falling back to npx supabase@latest.");
    result = spawnSync("npx", ["--yes", "supabase@latest", ...args], {
      stdio: "inherit",
      env: { ...process.env, ...options.env },
    });
  }

  if (result.status !== 0 && !options.allowFailure) {
    console.log("");
    console.log(`Stopped: ${label} failed.`);
    process.exit(result.status || 1);
  }

  return result.status === 0;
}

function hasValue(value) {
  return Boolean(value && !value.includes("<"));
}

async function confirm(rl, question) {
  const answer = await rl.question(`${question} (y/N) `);
  return answer.trim().toLowerCase() === "y";
}

const env = loadEnv();
const rl = readline.createInterface({ input, output });

try {
  console.log("This assistant deploys the missing Supabase preprod pieces:");
  console.log("- database migrations, after a dry-run");
  console.log("- required Edge Functions");
  console.log("");
  console.log(`Project: ${PROJECT_REF}`);
  console.log("");
  console.log("If Supabase asks for an access token, create one here:");
  console.log("https://supabase.com/dashboard/account/tokens");

  if (!hasValue(env.SUPABASE_ACCESS_TOKEN) && !hasValue(process.env.SUPABASE_ACCESS_TOKEN)) {
    console.log("");
    console.log("Missing SUPABASE_ACCESS_TOKEN.");
    console.log("Add it to .env.preprod first:");
    console.log("SUPABASE_ACCESS_TOKEN=<paste-your-supabase-access-token>");
    console.log("");
    console.log("Then re-run: npm run deploy:preprod-supabase");
    process.exit(1);
  }

  const supabaseEnv = {
    SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN,
    ...(env.SUPABASE_DB_PASSWORD ? { SUPABASE_DB_PASSWORD: env.SUPABASE_DB_PASSWORD } : {}),
  };

  run("Link local project to preprod", ["link", "--project-ref", PROJECT_REF], {
    env: supabaseEnv,
  });

  run("Show database migration dry-run", ["db", "push", "--dry-run"], {
    env: supabaseEnv,
  });

  const shouldPush = await confirm(
    rl,
    "If the dry-run only lists expected GO migrations and no scary reset/drop, apply the migrations now?"
  );
  if (!shouldPush) {
    console.log("Stopped before applying migrations. You can re-run this command later.");
  } else {
    run("Apply database migrations", ["db", "push"], {
      env: supabaseEnv,
    });

    for (const fn of FUNCTIONS) {
      run(`Deploy Edge Function ${fn}`, [
        "functions",
        "deploy",
        fn,
        "--project-ref",
        PROJECT_REF,
        "--no-verify-jwt",
        "--use-api",
      ], {
        env: supabaseEnv,
      });
    }

    console.log("");
    console.log("Supabase preprod deploy done. Now run: npm run validate:preprod");
  }
} finally {
  rl.close();
}
