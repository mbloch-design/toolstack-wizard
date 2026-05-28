import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const file = "scripts/go28-diagnostic-rls.sql";
const sql = readFileSync(file, "utf8");

if (process.platform === "darwin") {
  const result = spawnSync("pbcopy", { input: sql, encoding: "utf8" });
  if (result.status === 0) {
    console.log(`Copied ${file} to clipboard.`);
    console.log("Paste it into Supabase SQL Editor, then click Run.");
    process.exit(0);
  }
}

console.log(sql);
