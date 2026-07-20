#!/usr/bin/env node
/**
 * Prépare un staging canonique en lecture seule. Ce CLI n'a volontairement
 * aucun mode d'application, aucune dépendance DB et aucun accès réseau.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildStagingProposal, planRegistryFromResearch } from "./research-stage-model.mjs";
import { stagingProfileFor } from "./research-stage-profiles.mjs";
import { generateStageDryRunSql } from "./research-stage-sql.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function parseArgs(argv) {
  const args = { showPlan: false, emitSql: false };
  for (const arg of argv) {
    if (arg.startsWith("--slug=")) args.slug = arg.slice(7);
    else if (arg === "--show-plan") args.showPlan = true;
    else if (arg === "--emit-sql") args.emitSql = true;
    else if (arg === "--apply" || arg.startsWith("--apply=")) {
      throw new Error("research-stage est strictement DRY-RUN : --apply est interdit");
    } else throw new Error(`argument inconnu: ${arg}`);
  }
  if (!args.slug || !/^[a-z0-9][a-z0-9-]*$/.test(args.slug)) throw new Error("--slug=<slug> valide est requis");
  return args;
}

export async function prepareStageDryRun(slug) {
  const toolPath = path.join(ROOT, "research", "tool-pages", `${slug}.json`);
  const [toolRaw, registryRaw, manifestRaw, toolsRaw] = await Promise.all([
    readFile(toolPath, "utf8"),
    readFile(path.join(ROOT, "research", "sources-registry.json"), "utf8"),
    readFile(path.join(ROOT, "docs", "tool-catalog-migration", "contract-v3", "manifest-1126.json"), "utf8"),
    readFile(path.join(ROOT, "src", "data", "tools_v4.json"), "utf8"),
  ]);
  const doc = JSON.parse(toolRaw);
  const registry = JSON.parse(registryRaw);
  const manifest = JSON.parse(manifestRaw);
  const tools = JSON.parse(toolsRaw);
  if (doc.slug !== slug) throw new Error(`staging: slug dossier incohérent (${doc.slug ?? "null"})`);
  if (!manifest.slugs?.includes(slug)) throw new Error(`staging: ${slug} absent du manifeste publié`);
  if (sha256(toolsRaw) !== manifest.source?.sha256) throw new Error("staging: tools_v4 ne correspond pas au hash du manifeste");
  const toolArray = Array.isArray(tools) ? tools : (tools.tools ?? Object.values(tools));
  const publishedTools = new Map(toolArray
    .filter((tool) => manifest.slugs.includes(tool.slug))
    .map((tool) => [tool.slug, tool.id ?? tool.slug]));
  if (publishedTools.size !== manifest.slugCount) throw new Error("staging: identité du catalogue incomplète ou dupliquée");
  const toolId = publishedTools.get(slug);
  if (!toolId) throw new Error(`staging: identité SQL introuvable pour ${slug}`);
  const sourceEntry = registry.sources?.[slug];
  if (!sourceEntry) throw new Error(`staging: ${slug} absent du registre de sources`);
  const profile = stagingProfileFor(slug);
  const planRegistry = planRegistryFromResearch(doc, sourceEntry, profile);
  const proposal = buildStagingProposal(doc, {
    planRegistry,
    locale: profile.locale,
    toolId,
    publishedTools,
    legacyTool: toolArray.find((tool) => tool.slug === slug),
  });
  return {
    proposal,
    audit: {
      input_path: path.relative(ROOT, toolPath),
      input_sha256: sha256(toolRaw),
      manifest_slug_count: manifest.slugCount,
      manifest_slug_list_sha256: manifest.slugListSha256,
      manifest_git_commit: manifest.gitCommit,
      catalog_source_sha256: sha256(toolsRaw),
      registry_schema_version: registry.schemaVersion,
      profile: { plan_order: profile.planOrder, compare_plan_key: profile.comparePlanKey, locale: profile.locale },
      network_accessed: false,
      files_written: 0,
      sql_executed: false,
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await prepareStageDryRun(args.slug);
  if (args.emitSql) {
    process.stdout.write(generateStageDryRunSql(result.proposal));
    return;
  }
  const output = args.showPlan ? result : {
    mode: result.proposal.mode,
    tool_id: result.proposal.tool_id,
    proposal_hash: result.proposal.proposal_hash,
    counts: result.proposal.counts,
    approved_rows: result.proposal.approved_rows,
    audit: result.audit,
    proposal_not_applied: true,
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
