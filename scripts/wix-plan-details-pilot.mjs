#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";
import postgres from "postgres";

const ENV_FILE = process.env.TOOLTRIM_ENV_FILE || ".env.preprod";
const APPLY = process.argv.includes("--apply");
const ACTOR = "ToolTrim — Mike";

const DETAILS = {
  fr: {
    free: {
      summary: "Créer et tester un site sans abonnement",
      highlights: ["Hébergement Wix inclus", "Éditeur visuel sans code", "Fonctionnalités premium exclues"],
      source_url: "https://www.wix.com/plans",
    },
    light: {
      summary: "Pour les entrepreneurs individuels et les sites vitrines",
      highlights: ["2 Go de stockage", "Jusqu’à 2 collaborateurs", "Suite marketing limitée"],
      source_url: "https://www.wix.com/premium-purchase-plan/dynamo",
    },
    core: {
      summary: "Pour les petites équipes qui commencent à vendre en ligne",
      highlights: ["50 Go de stockage", "Jusqu’à 5 collaborateurs", "Paiements et e-commerce basiques"],
      source_url: "https://www.wix.com/plans",
    },
    business: {
      summary: "Pour les PME en croissance avec une activité en ligne",
      highlights: ["100 Go de stockage", "Jusqu’à 10 collaborateurs", "E-commerce et marketing standard"],
      source_url: "https://www.wix.com/plans",
    },
    business_elite: {
      summary: "Pour les entreprises complexes et les équipes étendues",
      highlights: ["Stockage illimité", "Jusqu’à 100 collaborateurs", "E-commerce, marketing et outils développeur avancés"],
      source_url: "https://www.wix.com/plans",
    },
  },
  en: {
    free: {
      summary: "Build and test a website without a subscription",
      highlights: ["Wix hosting included", "No-code visual editor", "Premium features excluded"],
      source_url: "https://www.wix.com/plans",
    },
    light: {
      summary: "For solo entrepreneurs and brochure websites",
      highlights: ["2 GB storage", "Up to 2 collaborators", "Light marketing suite"],
      source_url: "https://www.wix.com/plans",
    },
    core: {
      summary: "For small teams starting to sell online",
      highlights: ["50 GB storage", "Up to 5 collaborators", "Basic payments and eCommerce"],
      source_url: "https://www.wix.com/plans",
    },
    business: {
      summary: "For growing businesses with online sales",
      highlights: ["100 GB storage", "Up to 10 collaborators", "Standard eCommerce and marketing"],
      source_url: "https://www.wix.com/plans",
    },
    business_elite: {
      summary: "For complex businesses and larger teams",
      highlights: ["Unlimited storage", "Up to 100 collaborators", "Advanced eCommerce, marketing and developer tools"],
      source_url: "https://www.wix.com/plans",
    },
  },
};

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

function required(name) {
  const value = process.env[name];
  if (!value || value.includes("<")) throw new Error(`Variable manquante : ${name}`);
  return value;
}

function digest(value) {
  return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

class DryRunRollback extends Error {}

loadEnvFile(ENV_FILE);
const ref = required("VITE_SUPABASE_PROJECT_ID");
const sql = postgres({
  host: process.env.SUPABASE_DB_HOST || "aws-1-eu-central-1.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  username: `postgres.${ref}`,
  password: required("SUPABASE_DB_PASSWORD"),
  ssl: "require",
  max: 1,
});

let preview = [];
try {
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext('tooltrim:wix-plan-details-pilot'))`;
    const rows = await tx`
      select id,lang,content_hash,pricing_guidance
      from catalog_private.tool_editorial_content
      where tool_id='wix' and status='published'
      order by lang for update
    `;
    assert(rows.length === 2, `deux contenus Wix publiés attendus, reçu ${rows.length}`);

    for (const row of rows) {
      const details = DETAILS[row.lang];
      assert(details && Object.keys(details).length === 5, `cinq correspondances attendues en ${row.lang}`);
      const nextGuidance = { ...(row.pricing_guidance || {}), plan_details: details };
      for (const forbidden of ["native_amount", "native_currency", "compare_price_monthly_eur", "verified_on"]) {
        assert(!JSON.stringify(details).includes(forbidden), `fait de prix interdit dans plan_details: ${forbidden}`);
      }
      const nextHash = digest({ previous_content_hash: row.content_hash, pricing_guidance: nextGuidance });
      await tx`
        update catalog_private.tool_editorial_content
        set pricing_guidance=${tx.json(nextGuidance)},content_hash=${nextHash},
            reviewed_by=${ACTOR},updated_at=clock_timestamp()
        where id=${row.id}
      `;
    }

    preview = await tx`
      select lang,pricing_guidance->'plan_details' as plan_details
      from catalog_api.published_tool_projection where slug='wix' order by lang
    `;
    assert(preview.length === 2, "projection Wix bilingue absente");
    assert(preview.every((row) => Object.keys(row.plan_details || {}).length === 5), "projection incomplète");
    if (!APPLY) throw new DryRunRollback("rollback dry-run");
  });
} catch (error) {
  if (!(error instanceof DryRunRollback)) throw error;
}

const persisted = await sql`
  select lang,pricing_guidance->'plan_details' as plan_details
  from catalog_api.published_tool_projection where slug='wix' order by lang
`;
if (APPLY) assert(persisted.every((row) => Object.keys(row.plan_details || {}).length === 5), "COMMIT non vérifié");
await sql.end({ timeout: 1 });

console.log(JSON.stringify({
  mode: APPLY ? "APPLY" : "DRY_RUN_ROLLBACK",
  applied: APPLY,
  tool: "wix",
  languages: preview.map((row) => row.lang),
  plan_details_per_language: 5,
  price_facts_mutated: false,
}, null, 2));
