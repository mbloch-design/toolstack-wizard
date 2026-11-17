import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { apply: { type: "boolean" } } });
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function operation(action, assetId) {
  const { data, error } = await client.rpc("cms_cleanup_media", { p_action: action, p_asset_id: assetId ?? null });
  if (error) throw new Error("CMS media cleanup failed at " + action);
  return data;
}

const candidates = await operation("list");
if (!Array.isArray(candidates)) throw new Error("Unexpected cleanup response");
console.log(`${candidates.length} CMS media candidate(s)`);
if (values.apply) {
  for (const assetId of candidates) {
    if (typeof assetId !== "string" || !/^[0-9a-f-]{36}$/i.test(assetId)) throw new Error("Invalid cleanup asset");
    const paths = await operation("claim", assetId);
    if (paths === null) continue;
    if (!Array.isArray(paths) || paths.some((path) => typeof path !== "string" || !path.includes(assetId))) {
      throw new Error("Invalid storage cleanup paths");
    }
    if (paths.length) {
      const { error } = await client.storage.from("catalog-drafts").remove(paths);
      if (error) throw new Error("Storage cleanup failed; retry the claimed asset");
    }
    await operation("finish", assetId);
  }
}
