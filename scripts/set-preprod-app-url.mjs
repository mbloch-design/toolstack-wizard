import { existsSync, readFileSync, writeFileSync } from "node:fs";

const ENV_FILE = process.env.GO26_ENV_FILE || ".env.preprod";
const rawUrl = process.argv[2];

if (!rawUrl) {
  console.error("Usage: npm run set:preprod-url -- https://your-preview-url.vercel.app");
  process.exit(1);
}

let url;
try {
  url = new URL(rawUrl);
} catch {
  console.error(`Invalid URL: ${rawUrl}`);
  process.exit(1);
}

if (url.protocol !== "https:") {
  console.error("Preprod URL must start with https://");
  process.exit(1);
}

const normalizedUrl = url.toString().replace(/\/$/, "");

if (!existsSync(ENV_FILE)) {
  console.error(`${ENV_FILE} not found.`);
  process.exit(1);
}

const lines = readFileSync(ENV_FILE, "utf8").split(/\r?\n/);
const updates = new Map([
  ["PREPROD_APP_URL", normalizedUrl],
  ["TOOLTRIM_APP_URL", normalizedUrl],
]);
const seen = new Set();

const nextLines = lines.map((line) => {
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
  if (!match || !updates.has(match[1])) return line;
  seen.add(match[1]);
  return `${match[1]}=${updates.get(match[1])}`;
});

for (const [key, value] of updates) {
  if (!seen.has(key)) nextLines.push(`${key}=${value}`);
}

writeFileSync(ENV_FILE, `${nextLines.join("\n").replace(/\n+$/, "")}\n`);

console.log(`Preprod app URL saved in ${ENV_FILE}:`);
console.log(normalizedUrl);
console.log("");
console.log("Next: npm run validate:preprod-app");
