import { readFileSync } from "node:fs";

const pkg = readFileSync("package.json", "utf8");
const tools = JSON.parse(readFileSync("src/data/tools_v4.json", "utf8"));
const byId = new Map(tools.map((tool) => [tool.id, tool]));

const checks = [];

function ok(name, condition, details = "") {
  checks.push({ status: condition ? "OK" : "FAIL", name, details });
}

function optionValues(id) {
  return (byId.get(id)?.pricing_v5?.billing_options || []).map((option) => option.value);
}

function hasOptions(id, expected) {
  const values = optionValues(id);
  return expected.every((value) => values.includes(value));
}

ok(
  "package exposes GO71 validation",
  pkg.includes("\"validate:go71\""),
  "GO71 needs a dedicated validation entry"
);

ok(
  "client review tools expose real payment modes",
  byId.get("frame-io")?.pricing_v5?.billing_model === "seat" &&
    hasOptions("frame-io", ["free", "paid", "team", "unknown"]) &&
    byId.get("loom")?.pricing_v5?.billing_model === "seat" &&
    hasOptions("loom", ["free", "paid", "team", "unknown"]) &&
    byId.get("pixieset")?.pricing_v5?.billing_model === "subscription" &&
    hasOptions("pixieset", ["free", "paid", "team", "unknown"]),
  `frame-io=${optionValues("frame-io").join(", ")} loom=${optionValues("loom").join(", ")}`
);

ok(
  "crm and email tools stop pretending they are simple flat subscriptions",
  byId.get("brevo")?.pricing_v5?.billing_model === "usage_based" &&
    hasOptions("brevo", ["free", "usage", "custom_quote", "unknown"]) &&
    byId.get("hubspot")?.pricing_v5?.billing_model === "custom_quote" &&
    hasOptions("hubspot", ["free", "custom_quote", "included", "unknown"]) &&
    byId.get("mailerlite")?.pricing_v5?.billing_model === "usage_based" &&
    hasOptions("mailerlite", ["free", "usage", "custom_quote", "unknown"]),
  `brevo=${optionValues("brevo").join(", ")} hubspot=${optionValues("hubspot").join(", ")}`
);

ok(
  "workspace tools capture included and team scenarios",
  byId.get("notion")?.pricing_v5?.billing_model === "seat" &&
    hasOptions("notion", ["free", "paid", "team", "included", "unknown"]) &&
    byId.get("google-drive")?.pricing_v5?.billing_model === "subscription" &&
    hasOptions("google-drive", ["free", "paid", "included", "unknown"]) &&
    byId.get("dropbox")?.pricing_v5?.billing_model === "subscription" &&
    hasOptions("dropbox", ["free", "paid", "team", "unknown"]),
  `notion=${optionValues("notion").join(", ")} google-drive=${optionValues("google-drive").join(", ")}`
);

ok(
  "growth and monetization tools capture variable or quote-based billing",
  byId.get("stripe")?.pricing_v5?.billing_model === "usage_based" &&
    hasOptions("stripe", ["usage", "custom_quote", "unknown"]) &&
    byId.get("posthog")?.pricing_v5?.billing_model === "usage_based" &&
    hasOptions("posthog", ["free", "usage", "custom_quote", "unknown"]) &&
    byId.get("hotjar")?.pricing_v5?.billing_model === "subscription" &&
    hasOptions("hotjar", ["free", "paid", "team", "unknown"]),
  `stripe=${optionValues("stripe").join(", ")} posthog=${optionValues("posthog").join(", ")}`
);

ok(
  "solo business tools avoid fake team defaults",
  byId.get("indy")?.pricing_v5?.billing_model === "subscription" &&
    hasOptions("indy", ["paid", "included", "unknown"]) &&
    byId.get("framer")?.pricing_v5?.billing_model === "subscription" &&
    hasOptions("framer", ["free", "paid", "team", "unknown"]) &&
    byId.get("milanote")?.pricing_v5?.billing_model === "subscription" &&
    hasOptions("milanote", ["free", "paid", "team", "unknown"]),
  `indy=${optionValues("indy").join(", ")} framer=${optionValues("framer").join(", ")}`
);

for (const item of checks) {
  console.log(`[${item.status}] ${item.name}`);
  if (item.details && item.status !== "OK") console.log(`     ${item.details}`);
}

const failed = checks.filter((item) => item.status === "FAIL");
console.log("");
console.log(`GO71 pricing coverage verdict: ${failed.length === 0 ? "PASS" : "FAIL"}`);
console.log(`Checks: ${checks.length}, failed: ${failed.length}`);

if (failed.length > 0) process.exit(1);
