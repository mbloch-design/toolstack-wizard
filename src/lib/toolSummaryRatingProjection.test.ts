// @vitest-environment node
import { expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

it("projects editorial axes and freshness without adding evidence prose to the light index", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "tooltrim-rating-index-"));
  try {
    await mkdir(path.join(root, "src/data"), { recursive: true });
    await writeFile(path.join(root, "src/data/tools_v4.json"), JSON.stringify([
      { id: "reviewed", slug: "reviewed", toolTrimRating: {
        valeurAjoutee: 4, simplicite: 3, utilisation: 4, puissance: 5, reversibilite: 4,
        notedOn: "2026-10-17", lastActivityVerifiedOn: null,
        evidence: { valeurAjoutee: "Full source explanation" }, evidenceEn: { valeurAjoutee: "Translation" },
      } },
      { id: "unrated", slug: "unrated" },
    ]));
    execFileSync(process.execPath, [path.resolve("scripts/gen-tools-index.mjs")], { cwd: root });
    const rows = JSON.parse(await readFile(path.join(root, "src/data/tools_index.json"), "utf8"));
    expect(rows[0].toolTrimRating).toEqual({
      valeurAjoutee: 4, simplicite: 3, utilisation: 4, puissance: 5, reversibilite: 4,
      notedOn: "2026-10-17", lastActivityVerifiedOn: null,
    });
    expect(rows[1]).not.toHaveProperty("toolTrimRating");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
