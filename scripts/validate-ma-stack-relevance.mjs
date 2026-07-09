#!/usr/bin/env node
import { readFileSync } from "node:fs";

const CART_PAGE = "src/pages/CartPage.tsx";
const TOOL_INDEX = "src/data/tools_index.json";

const source = readFileSync(CART_PAGE, "utf8");
const tools = JSON.parse(readFileSync(TOOL_INDEX, "utf8"));

const toolByKey = new Map();
for (const tool of tools) {
  [tool.id, tool.slug].filter(Boolean).forEach((key) => toolByKey.set(normalizeKey(key), tool));
}

const objectiveBlocks = extractObjectBlocks(source, "OBJECTIVE_PICKER_CONFIGS");

const OBJECTIVE_CONTRACTS = {
  design: {
    requiredStarters: ["figma", "adobe-illustrator", "adobe-photoshop", "canva", "framer"],
    sourceMarkers: ["DESIGN_PICKER_SUBDOMAIN_IDS", "DESIGN_PICKER_CORE_SUBDOMAIN_ORDER"],
  },
  ia: {
    requiredStarters: ["chatgpt", "claude", "perplexity", "cursor", "midjourney", "runway"],
    forbidden: ["adobe-photoshop", "canva", "google-sheets", "stripe"],
    requiredSignals: ["generation-texte", "generation-image", "coding", "transcription"],
  },
  organisation: {
    requiredStarters: ["notion", "clickup", "asana", "slack", "google-drive"],
    forbidden: ["adobe-photoshop", "midjourney", "stripe", "vercel"],
    requiredSignals: ["project-management", "task-management", "notes", "team-communication"],
  },
  automation: {
    requiredStarters: ["make", "zapier", "n8n", "airtable", "softr"],
    forbidden: ["adobe-photoshop", "mailchimp", "pennylane", "figma"],
    requiredSignals: ["automation", "workflow", "api", "no-code"],
  },
  marketing: {
    requiredStarters: ["hubspot", "brevo", "mailchimp", "buffer", "google-analytics"],
    forbidden: ["pennylane", "github", "adobe-photoshop", "vercel"],
    requiredSignals: ["email-marketing", "newsletter", "seo", "web-analytics"],
  },
  vente: {
    requiredStarters: ["hubspot", "pipedrive", "salesforce", "apollo-io", "stripe"],
    forbidden: ["notion", "adobe-photoshop", "midjourney", "github"],
    requiredSignals: ["crm", "lead-generation", "pipeline", "payment"],
  },
  finance: {
    requiredStarters: ["pennylane", "indy", "quickbooks", "stripe", "dext"],
    forbidden: ["canva", "figma", "midjourney", "github"],
    requiredSignals: ["accounting", "facturation", "expense-management", "receipt-capture"],
  },
  dev: {
    requiredStarters: ["github", "cursor", "github-copilot", "vercel", "supabase", "next-js"],
    forbidden: ["mailchimp", "pennylane", "canva", "brevo"],
    requiredSignals: ["code", "ci-cd", "database", "hosting", "monitoring"],
  },
};

const checks = [];

function ok(label, condition, details = "") {
  checks.push({ label, condition: Boolean(condition), details });
}

ok("CartPage exposes objective subdomains", source.includes("OBJECTIVE_STACK_SUBDOMAINS"));
ok("CartPage exposes objective picker configs", source.includes("OBJECTIVE_PICKER_CONFIGS"));
ok("IA board pattern uses word-bounded AI", /pattern:\s*\/\\bia\\b\|\\bai\\b/.test(source));
ok("Strict objective signal is implemented", source.includes("config.strictSignal && !hasStrongObjectiveSignal"));
ok("Bundle relation cannot alone hijack objectives", source.includes("canUseBundleAsObjectiveSignal"));
ok("Shared needs cannot alone hijack objectives", source.includes("canUseSharedNeedsAsObjectiveSignal"));
ok("IA has an explicit non-IA false-positive guard", source.includes('board.id === "ia" && tool.tool_type !== "ia"'));

for (const objectiveId of Object.keys(OBJECTIVE_CONTRACTS)) {
  const contract = OBJECTIVE_CONTRACTS[objectiveId];
  const block = objectiveBlocks.get(objectiveId);
  ok(`${objectiveId}: picker config exists`, !!block);
  if (!block) continue;

  const starterTools = getConfigArray(block, "starterToolIds", source);
  const signalKeys = getConfigArray(block, "signalKeys", source);
  const categoryIds = getConfigArray(block, "categoryIds", source);
  const strictSignal = /strictSignal:\s*true/.test(block);

  if (objectiveId !== "design") {
    ok(`${objectiveId}: strict signal enabled`, strictSignal);
  }

  ok(`${objectiveId}: enough starter tools`, starterTools.length >= 5, `${starterTools.length} starter tools`);

  for (const starter of contract.requiredStarters || []) {
    ok(`${objectiveId}: starter ${starter} is configured`, starterTools.includes(starter));
    ok(`${objectiveId}: starter ${starter} exists in catalog`, toolByKey.has(normalizeKey(starter)));
  }

  for (const marker of contract.sourceMarkers || []) {
    ok(`${objectiveId}: source marker ${marker} present`, source.includes(marker));
  }

  for (const signal of contract.requiredSignals || []) {
    ok(`${objectiveId}: signal ${signal} is configured`, signalKeys.includes(signal));
  }

  for (const forbidden of contract.forbidden || []) {
    const tool = toolByKey.get(normalizeKey(forbidden));
    ok(`${objectiveId}: forbidden fixture ${forbidden} exists`, !!tool);
    if (!tool) continue;
    ok(
      `${objectiveId}: ${forbidden} has no direct objective signal`,
      !hasDirectObjectiveSignal(tool, { starterTools, signalKeys, categoryIds }),
      describeDirectSignals(tool, { starterTools, signalKeys, categoryIds })
    );
  }
}

const failures = checks.filter((check) => !check.condition);

for (const check of checks) {
  if (check.condition) {
    console.log(`[OK] ${check.label}`);
  } else {
    console.log(`[FAIL] ${check.label}`);
    if (check.details) console.log(`     ${check.details}`);
  }
}

console.log(`\nMa stack relevance verdict: ${failures.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failures.length}`);

if (failures.length > 0) process.exit(1);

function normalizeKey(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toolSignals(tool) {
  return new Set([
    tool.id,
    tool.slug,
    tool.name,
    tool.categoryId,
    tool.tool_type,
    tool.host_app,
    tool.bundle_parent,
    tool.substitution_cluster_v2,
    ...(tool.functional_needs || []),
    ...(tool.covers || []),
  ].map(normalizeKey).filter(Boolean));
}

function hasDirectObjectiveSignal(tool, config) {
  const identities = [tool.id, tool.slug].map(normalizeKey);
  const starterMatch = identities.some((key) => config.starterTools.includes(key));
  const categoryMatch = config.categoryIds.includes(normalizeKey(tool.categoryId));
  const signals = toolSignals(tool);
  const signalMatch = config.signalKeys.some((key) => signals.has(normalizeKey(key)));
  return starterMatch || categoryMatch || signalMatch;
}

function describeDirectSignals(tool, config) {
  const signals = toolSignals(tool);
  const hits = {
    starter: [tool.id, tool.slug].map(normalizeKey).filter((key) => config.starterTools.includes(key)),
    category: config.categoryIds.includes(normalizeKey(tool.categoryId)) ? [tool.categoryId] : [],
    signal: config.signalKeys.filter((key) => signals.has(normalizeKey(key))),
  };
  return JSON.stringify(hits);
}

function getConfigArray(block, propertyName, fullSource) {
  const directMatch = block.match(new RegExp(`${propertyName}:\\s*\\[([\\s\\S]*?)\\]`));
  if (directMatch) return extractStrings(directMatch[1]);

  const constMatch = block.match(new RegExp(`${propertyName}:\\s*Array\\.from\\(([^)]+)\\)`));
  if (constMatch) return getConstArray(fullSource, constMatch[1].trim());

  const refMatch = block.match(new RegExp(`${propertyName}:\\s*([A-Z0-9_]+)`));
  if (refMatch) return getConstArray(fullSource, refMatch[1].trim());

  return [];
}

function getConstArray(fullSource, constName) {
  const arrayMatch = fullSource.match(new RegExp(`const\\s+${escapeRegExp(constName)}\\s*=\\s*\\[([\\s\\S]*?)\\];`));
  if (arrayMatch) return extractStrings(arrayMatch[1]);

  const setMatch = fullSource.match(new RegExp(`const\\s+${escapeRegExp(constName)}\\s*=\\s*new\\s+Set\\(\\s*\\[([\\s\\S]*?)\\]\\s*\\);`));
  if (setMatch) return extractStrings(setMatch[1]);

  return [];
}

function extractStrings(value) {
  return [...value.matchAll(/"([^"]+)"/g)].map((match) => normalizeKey(match[1]));
}

function extractObjectBlocks(fullSource, constName) {
  const startToken = `const ${constName}`;
  const start = fullSource.indexOf(startToken);
  if (start === -1) return new Map();
  const objectStart = fullSource.indexOf("{", start);
  const objectEnd = findMatchingBrace(fullSource, objectStart);
  const objectBody = fullSource.slice(objectStart + 1, objectEnd);
  const blocks = new Map();
  let index = 0;

  while (index < objectBody.length) {
    const match = objectBody.slice(index).match(/\b([a-z][a-z0-9_-]*):\s*\{/i);
    if (!match) break;
    const key = match[1];
    const relativeOpen = match.index + match[0].lastIndexOf("{");
    const open = index + relativeOpen;
    const close = findMatchingBrace(objectBody, open);
    blocks.set(key, objectBody.slice(open, close + 1));
    index = close + 1;
  }

  return blocks;
}

function findMatchingBrace(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    if (text[i] === "}") depth -= 1;
    if (depth === 0) return i;
  }
  throw new Error("Unable to find matching brace");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
