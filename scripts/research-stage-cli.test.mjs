import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareStageDryRun } from "./research-stage.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "scripts", "research-stage.mjs");
const WIX = path.join(ROOT, "research", "tool-pages", "wix.json");
const hash = (value) => createHash("sha256").update(value).digest("hex");

describe("research-stage CLI — dry-run structurel", () => {
  it("prépare Wix sans modifier le dossier", async () => {
    const before = await readFile(WIX);
    const { proposal, audit } = await prepareStageDryRun("wix");
    expect(proposal.approved_rows).toBe(0);
    expect(proposal.counts.tool_price_observations).toBe(4);
    expect(proposal.counts.tool_editorial_content).toBe(2);
    expect(proposal.tables.tool_editorial_content.every((row) => row.status === "draft")).toBe(true);
    expect(audit).toMatchObject({ network_accessed: false, files_written: 0, sql_executed: false });
    expect(hash(await readFile(WIX))).toBe(hash(before));
  });

  it("refuse explicitement toute tentative --apply", () => {
    const run = spawnSync(process.execPath, [CLI, "--slug=wix", "--apply"], { cwd: ROOT, encoding: "utf8" });
    expect(run.status).not.toBe(0);
    expect(run.stderr).toMatch(/--apply est interdit/);
  });

  it("émet un résumé déterministe et non la proposition brute par défaut", () => {
    const run = spawnSync(process.execPath, [CLI, "--slug=wix"], { cwd: ROOT, encoding: "utf8" });
    expect(run.status).toBe(0);
    const result = JSON.parse(run.stdout);
    expect(result).toMatchObject({ mode: "STAGING_PROPOSAL_ONLY", tool_id: "wix", approved_rows: 0, proposal_not_applied: true });
    expect(result.tables).toBeUndefined();
  });
});
