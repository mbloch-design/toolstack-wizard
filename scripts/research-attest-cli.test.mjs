import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(PROJECT_ROOT, "scripts", "research-attest.mjs");
const REAL_WIX = path.join(PROJECT_ROOT, "research", "tool-pages", "wix.json");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

let realWixBefore;
let root;
let fixturePath;
let basis;
let initialReviewCount;
let initialEventIds;

function runCli(extra = []) {
  const result = spawnSync(process.execPath, [SCRIPT,
    "--slug=wix",
    "--attest=market_context",
    "--value=reference_fr",
    `--basis=${basis}`,
    '--by=CLI Fixture Reviewer',
    ...extra,
  ], { cwd: root, encoding: "utf8" });
  return result;
}

async function readFixture() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}

beforeEach(async () => {
  realWixBefore = await readFile(REAL_WIX);
  root = await mkdtemp(path.join(tmpdir(), "tooltrim-attest-cli-"));
  fixturePath = path.join(root, "research", "tool-pages", "wix.json");

  // Garde structurelle : le processus enfant travaille sous os.tmpdir(), jamais
  // dans le dépôt ni dans research/tool-pages réel.
  expect(path.relative(PROJECT_ROOT, root).startsWith("..")).toBe(true);
  expect(fixturePath).not.toBe(REAL_WIX);

  await mkdir(path.dirname(fixturePath), { recursive: true });
  await writeFile(fixturePath, realWixBefore);

  const doc = await readFixture();
  const observationKeys = new Set((doc.collector?.observations ?? [])
    .map((o) => `${o.source_url}\n${o.content_hash}`));
  const context = [...(doc.collector?.context_attestations ?? [])].reverse()
    .find((candidate) => observationKeys.has(`${candidate.source_url}\n${candidate.content_hash}`));
  expect(context, "la fixture doit contenir une basis reliée aux observations").toBeTruthy();
  basis = context.attestation_id;
  initialReviewCount = (doc.review_attestations ?? []).length;
  initialEventIds = (doc.review_events ?? []).map((event) => event.review_event_id ?? event.event_id ?? JSON.stringify(event));
});

afterEach(async () => {
  // Même si un test échoue, le dossier réel doit rester identique au bit près.
  expect(sha256(await readFile(REAL_WIX))).toBe(sha256(realWixBefore));
  if (root) await rm(root, { recursive: true, force: true });
});

describe("research-attest CLI — isolation et DRY-RUN strict", () => {
  it("sans --apply, affiche le gate prévu et ne modifie pas la fixture", async () => {
    const before = await readFile(fixturePath);
    const result = runCli();

    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.applied).toBe(false);
    expect(output.mode).toMatch(/DRY-RUN/);
    expect(output.gate_expected).toHaveLength(4);
    expect(output.gate_expected.every((gate) => gate.eligible && gate.blockers.length === 0)).toBe(true);
    expect(sha256(await readFile(fixturePath))).toBe(sha256(before));
  });

  it("--apply écrit seulement la fixture et conserve les review_events", async () => {
    const result = runCli(["--apply"]);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).applied).toBe(true);
    const doc = await readFixture();
    expect(doc.review_attestations).toHaveLength(initialReviewCount + 1);
    expect((doc.review_events ?? []).map((event) => event.review_event_id ?? event.event_id ?? JSON.stringify(event)))
      .toEqual(initialEventIds);
  });

  it("une seconde application identique est un no-op au bit près", async () => {
    expect(runCli(["--apply"]).status).toBe(0);
    const afterFirst = await readFile(fixturePath);
    const second = runCli(["--apply"]);

    expect(second.status).toBe(0);
    expect(JSON.parse(second.stdout)).toMatchObject({ noop: true, reason: "duplicate_attestation", applied: false });
    expect(sha256(await readFile(fixturePath))).toBe(sha256(afterFirst));
  });

  it("une attestation devenue inactive/révoquée n'est pas un doublon applicable", async () => {
    expect(runCli(["--apply"]).status).toBe(0);
    const doc = await readFixture();
    const first = doc.review_attestations.at(-1);
    first.active = false;
    first.revoked_at = "2026-07-17T15:00:00.000Z";
    await writeFile(fixturePath, JSON.stringify(doc, null, 2) + "\n");

    const retry = runCli(["--apply"]);
    expect(retry.status).toBe(0);
    expect(JSON.parse(retry.stdout).applied).toBe(true);
    const after = await readFixture();
    expect(after.review_attestations).toHaveLength(initialReviewCount + 2);
    expect(after.review_attestations.at(-2)).toMatchObject({ active: false, revoked_at: "2026-07-17T15:00:00.000Z" });
    expect(after.review_attestations.at(-1).review_attestation_id).not.toBe(first.review_attestation_id);
  });

  it("une basis inconnue est refusée sans aucune mutation", async () => {
    const before = await readFile(fixturePath);
    basis = "sha256:basis-inconnue";
    const result = runCli(["--apply"]);

    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/basis inconnu/);
    expect(sha256(await readFile(fixturePath))).toBe(sha256(before));
  });
});
