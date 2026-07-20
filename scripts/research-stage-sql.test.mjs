import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareStageDryRun } from "./research-stage.mjs";
import { generateStageDryRunSql } from "./research-stage-sql.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function ddlColumns(ddl, table) {
  const start = ddl.indexOf(`create table catalog_private.${table} (`);
  if (start < 0) throw new Error(`table DDL absente: ${table}`);
  const tail = ddl.slice(start).split(/\ncreate (?:table|view|or replace function)|\n-- /, 1)[0];
  return new Set([...tail.matchAll(/\b([a-z][a-z0-9_]*)\s+(?:uuid|text|jsonb|boolean|smallint|int|numeric|date|timestamptz)\b/g)]
    .map((match) => match[1]));
}

describe("SQL de staging — répétition générale uniquement", () => {
  it("est déterministe, transactionnel et finit par rollback", async () => {
    const { proposal } = await prepareStageDryRun("wix");
    const a = generateStageDryRunSql(proposal);
    const b = generateStageDryRunSql(proposal);
    expect(a).toBe(b);
    expect(a).toMatch(/^-- GENERATED \/ STAGING DRY-RUN ONLY/);
    expect(a).toContain("begin;");
    expect(a.trimEnd().endsWith("rollback;")).toBe(true);
    expect(a).not.toMatch(/\bcommit\s*;/i);
    expect(a).toContain(proposal.proposal_hash);
  });

  it("porte les gardes de publication, d'approved et l'ordre du ledger", async () => {
    const { proposal } = await prepareStageDryRun("wix");
    const sql = generateStageDryRunSql(proposal);
    expect(sql).toContain("catalog_private.published_manifest");
    expect(sql).toContain("t.content_status='published'");
    expect(sql).toContain("m.slug=t.slug");
    expect(sql).toContain("t.id=v_tool_id and t.slug=v_tool_slug");
    expect(sql).toContain("staging import touched an approved fact");
    expect(sql.indexOf("insert into catalog_private.tool_price_observations"))
      .toBeLessThan(sql.indexOf("insert into catalog_private.tool_review_events"));
    expect(sql.indexOf("insert into catalog_private.tool_editorial_content"))
      .toBeLessThan(sql.indexOf("insert into catalog_private.tool_review_events"));
  });

  it("n'insère aucune colonne absente du DDL rév. 4.7", async () => {
    const { proposal } = await prepareStageDryRun("wix");
    const sql = generateStageDryRunSql(proposal);
    const ddl = await readFile(path.join(ROOT, "docs", "tool-catalog-migration", "contract-v3", "A1-contrat-canonique.sql.md"), "utf8");
    for (const match of sql.matchAll(/insert into catalog_private\.([a-z0-9_]+)\s*\n?\s*\(([^)]+)\)/g)) {
      const [, table, rawColumns] = match;
      const allowed = ddlColumns(ddl, table);
      const unknown = rawColumns.split(",").map((column) => column.trim()).filter((column) => !allowed.has(column));
      expect(unknown, `${table}: colonnes hors DDL`).toEqual([]);
    }
  });

  it("refuse une proposition comportant approved", async () => {
    const { proposal } = await prepareStageDryRun("wix");
    expect(() => generateStageDryRunSql({ ...proposal, approved_rows: 1 })).toThrow(/approved_rows/);
  });

  it("câble les relations après leurs captures et avant le ledger", async () => {
    const { proposal } = await prepareStageDryRun("wix");
    const withRelation = structuredClone(proposal);
    withRelation.tables.tool_relationships.push({
      tool_id: "wix",
      related_tool_id: "squarespace",
      related_tool_slug: "squarespace",
      collector_id: `rel:${"1".repeat(64)}`,
      rel_type: "substitutes",
      direction: "directed",
      reason_fr: "Alternative expliquée",
      status: "proposed",
      collector_payload: {},
    });
    const sql = generateStageDryRunSql(withRelation);
    const relationInsert = sql.indexOf("insert into catalog_private.tool_relationships");
    expect(relationInsert).toBeGreaterThan(sql.indexOf("insert into catalog_private.tool_source_captures"));
    expect(relationInsert).toBeLessThan(sql.indexOf("insert into catalog_private.tool_review_events"));
    expect(sql).toContain("relationship target is not published");
  });
});
