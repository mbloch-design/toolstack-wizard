import { AccountApiError, getAccountServiceClient } from "./_account-auth.js";
import { catalogHash } from "./_backoffice-catalog-contract.js";
import { matchPublishedCatalogRelease, publishCatalog, readCatalog } from "./_backoffice-catalog-github.js";
import { cleanupCatalogDrafts } from "./_backoffice-catalog-store.js";
import { preparePublisherRelease } from "./_cms-prepare-release.js";
import { cmsActorArgs, requireCmsRpcSuccess, type CmsActor } from "./_cms-store.js";
import type { Json } from "../src/integrations/supabase/types.js";

type ReleaseManifest = Awaited<ReturnType<typeof preparePublisherRelease>>["manifest"];
type Receipt = {
  batch_key: string;
  manifest: ReleaseManifest;
  commit_sha: string | null;
  verified_at: string | null;
};

function receipt(value: Json | null): Receipt | null {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.batch_key !== "string"
    || !value.manifest || typeof value.manifest !== "object" || Array.isArray(value.manifest)
    || !Array.isArray(value.manifest.items) || !Array.isArray(value.manifest.legacyItems)) {
    throw new AccountApiError(503, "CMS_WORKSPACE_UNAVAILABLE");
  }
  return value as unknown as Receipt;
}

export async function readReleaseStatus(actor: CmsActor, batchKey: string) {
  const { data, error } = await getAccountServiceClient().rpc("cms_get_release_batch", {
    ...cmsActorArgs(actor), p_key: batchKey,
  });
  requireCmsRpcSuccess(error);
  return receipt(data);
}

export async function deliverPublisherRelease(actor: CmsActor, batchKey: string) {
  const client = getAccountServiceClient();
  const args = { ...cmsActorArgs(actor), p_key: batchKey };
  const existing = await readReleaseStatus(actor, batchKey);
  if (existing?.commit_sha) return { release: existing, cleanupPending: false };
  if (existing) {
    const source = await readCatalog();
    if (source.headSha !== existing.manifest.sourceHead) {
      if (catalogHash(source.tools) !== existing.manifest.catalogueHash) throw new AccountApiError(409, "CMS_RELEASE_SOURCE_CHANGED");
      const committed = await matchPublishedCatalogRelease(source, { batchKey, catalogueHash: existing.manifest.catalogueHash });
      if (!committed) throw new AccountApiError(409, "CMS_RELEASE_SOURCE_CHANGED");
      const { data, error } = await client.rpc("cms_record_release_commit", { ...args, p_commit: committed.commitSha });
      requireCmsRpcSuccess(error);
      return { release: receipt(data), cleanupPending: existing.manifest.legacyItems.length > 0 };
    }
  }

  const prepared = await preparePublisherRelease(actor, true);
  if (catalogHash(prepared.manifest) !== batchKey ||
    (!prepared.manifest.items.length && !prepared.manifest.legacyItems.length)) {
    throw new AccountApiError(409, "CMS_RELEASE_SOURCE_CHANGED");
  }
  const sealed = await client.rpc("cms_seal_release_batch", { ...args, p_manifest: prepared.manifest });
  requireCmsRpcSuccess(sealed.error);
  const sealedReceipt = receipt(sealed.data);
  if (sealedReceipt?.commit_sha) return { release: sealedReceipt, cleanupPending: false };

  const committed = await publishCatalog(prepared.source, prepared.tools, {
    marker: { batchKey, catalogueHash: prepared.manifest.catalogueHash },
    media: prepared.mediaFiles,
  });
  const stamp = await client.rpc("cms_record_release_commit", { ...args, p_commit: committed.commitSha });
  requireCmsRpcSuccess(stamp.error);

  let cleanupPending = false;
  try {
    await cleanupCatalogDrafts(prepared.legacyDrafts);
  } catch {
    cleanupPending = true;
  }
  return { release: receipt(stamp.data), cleanupPending };
}

async function fetchVercel(path: string, token: string) {
  const target = new URL("https://api.vercel.com" + path);
  if (process.env.CMS_VERCEL_TEAM_ID) target.searchParams.set("teamId", process.env.CMS_VERCEL_TEAM_ID);
  const response = await fetch(target, {
    headers: { Authorization: "Bearer " + token },
    redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new AccountApiError(503, "CMS_RELEASE_VERIFICATION_UNAVAILABLE");
  return response.json();
}

export async function verifyPublisherRelease(actor: CmsActor, batchKey: string) {
  const release = await readReleaseStatus(actor, batchKey);
  if (!release?.commit_sha) throw new AccountApiError(409, "CMS_RELEASE_NOT_COMMITTED");
  if (release.verified_at) return release;
  const token = process.env.CMS_VERCEL_TOKEN;
  const projectId = process.env.CMS_VERCEL_PROJECT_ID;
  if (!token || !projectId) throw new AccountApiError(503, "CMS_RELEASE_VERIFICATION_NOT_CONFIGURED");

  const alias = await fetchVercel("/v4/aliases/tooltrim.com", token);
  if (typeof alias.deploymentId !== "string" || !/^dpl_[a-zA-Z0-9]+$/.test(alias.deploymentId)) {
    throw new AccountApiError(503, "CMS_RELEASE_VERIFICATION_UNAVAILABLE");
  }
  const deployment = await fetchVercel("/v13/deployments/" + alias.deploymentId, token);
  const sha = deployment.meta?.githubCommitSha ?? deployment.gitSource?.sha;
  if (deployment.projectId !== projectId || deployment.readyState !== "READY" || sha !== release.commit_sha) {
    throw new AccountApiError(409, "CMS_RELEASE_AWAITING_DEPLOYMENT");
  }
  const marker = await fetch("https://tooltrim.com/catalog-release.json?batch=" + batchKey, {
    redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  if (!marker.ok) throw new AccountApiError(409, "CMS_RELEASE_AWAITING_DEPLOYMENT");
  const body = await marker.json();
  if (body.batchKey !== batchKey || body.catalogueHash !== release.manifest.catalogueHash) {
    throw new AccountApiError(409, "CMS_RELEASE_AWAITING_DEPLOYMENT");
  }
  const items = [...release.manifest.items, ...release.manifest.legacyItems];
  // Check all changed records in small groups to stay within the HTTP runtime budget.
  const slugs = [...new Set(items.map(({ slug }) => slug))];
  for (let offset = 0; offset < slugs.length; offset += 5) {
    await Promise.all(slugs.slice(offset, offset + 5).flatMap((slug) => ["fr", "en"].map(async (lang) => {
      const path = `/${lang}/tool/${encodeURIComponent(slug)}`;
      const response = await fetch("https://tooltrim.com" + path, {
        redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10000),
      });
      if (!response.ok || !(await response.text()).includes('href="https://tooltrim.com' + path + '"')) {
        throw new AccountApiError(409, "CMS_RELEASE_ROUTE_NOT_VERIFIED");
      }
    })));
  }
  // Check the alias again once the pages have been read.
  const finalAlias = await fetchVercel("/v4/aliases/tooltrim.com", token);
  if (finalAlias.deploymentId !== alias.deploymentId) throw new AccountApiError(409, "CMS_RELEASE_AWAITING_DEPLOYMENT");
  const { data, error } = await getAccountServiceClient().rpc("cms_record_verified_release", {
    ...cmsActorArgs(actor), p_key: batchKey, p_commit: release.commit_sha,
  });
  requireCmsRpcSuccess(error);
  return receipt(data);
}
