import { AccountApiError, getAccountServiceClient } from "./_account-auth.js";
import { isMediaMime, mediaRoles, processCmsImage, type MediaMime, type MediaRole } from "./_catalog-media-image.js";
import type { CmsActor } from "./_cms-store.js";

const PRIVATE_BUCKET = "catalog-drafts";
const PREVIEW_SECONDS = 60;
const statuses = {
  PT400: [400, "CMS_INVALID_MEDIA_REQUEST"], PT401: [401, "ACCOUNT_SESSION_INVALID"],
  PT403: [403, "CMS_ACCESS_DENIED"], PT404: [404, "CMS_MEDIA_NOT_FOUND"],
  PT409: [409, "CMS_MEDIA_CONFLICT"], PT429: [429, "CMS_MEDIA_QUOTA"],
} as const;
const unavailable = () => new AccountApiError(503, "CMS_MEDIA_UNAVAILABLE");
const uuidPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export const isAssetId = (value: unknown): value is string => typeof value === "string" && uuidPattern.test(value);

export type MediaTarget = { kind: "listing" | "tool"; id: string };
export type ReserveMetadata = {
  target: MediaTarget;
  role: MediaRole;
  mimeType: MediaMime;
  bytes: number;
  idempotencyKey: string;
  replaceAssetId?: string;
};
type AssetRecord = {
  assetId: string;
  state: "reserved" | "ready" | "rejected";
  path: string;
  role: MediaRole;
  mimeType: MediaMime;
  bytes: number;
  expiresAt: string;
  uploadRequired: boolean;
  processingToken: string | null;
  derivativePath: string | null;
};

type AssetOperation = "reserve" | "beginFinalize" | "finish" | "releaseProcessing" | "preview";
async function accessAsset(actor: CmsActor, action: AssetOperation, payload: Record<string, unknown>) {
  const client = getAccountServiceClient();
  const call = client.rpc.bind(client) as unknown as (name: "cms_media", args: Record<string, unknown>) =>
    PromiseLike<{ data: AssetRecord | null; error: { code: string } | null }>;
  const { data, error } = await call("cms_media", {
    p_actor: actor.userId, p_session: actor.sessionId, p_action: action, p_value: payload,
  });
  if (error) {
    const status = statuses[error.code as keyof typeof statuses];
    throw status ? new AccountApiError(status[0], status[1]) : unavailable();
  }
  if (!data || !isAssetId(data.assetId) || data.path !== `originals/${data.assetId}` || !isMediaMime(data.mimeType)
    || !mediaRoles.includes(data.role) || !Number.isInteger(data.bytes) || typeof data.expiresAt !== "string") throw unavailable();
  return data;
}

export async function reserveAsset(actor: CmsActor, metadata: ReserveMetadata) {
  const { assetId, path, expiresAt, state, uploadRequired } = await accessAsset(actor, "reserve", metadata);
  return { assetId, path, expiresAt, state, uploadRequired };
}

async function signAssetPreview(asset: AssetRecord) {
  const path = asset.derivativePath;
  if (asset.state !== "ready" || !path || !new RegExp(`^derived/${asset.assetId}/[a-f0-9]{64}\\.webp$`).test(path)) throw unavailable();
  const bucket = getAccountServiceClient().storage.from(PRIVATE_BUCKET);
  const { data, error } = await bucket.createSignedUrl(path, PREVIEW_SECONDS);
  if (error || !data?.signedUrl) throw unavailable();
  return { assetId: asset.assetId, state: "ready" as const, previewUrl: data.signedUrl,
    expiresAt: new Date(Date.now() + PREVIEW_SECONDS * 1000).toISOString() };
}

export async function getAssetPreview(actor: CmsActor, assetId: string) {
  return signAssetPreview(await accessAsset(actor, "preview", { assetId }));
}

export async function finalizeAsset(actor: CmsActor, assetId: string) {
  const asset = await accessAsset(actor, "beginFinalize", { assetId });
  if (asset.state === "ready") return signAssetPreview(asset);
  const token = asset.processingToken;
  if (!isAssetId(token)) throw unavailable();
  const bucket = getAccountServiceClient().storage.from(PRIVATE_BUCKET);
  let finalized: AssetRecord;
  try {
    if (asset.uploadRequired) throw new AccountApiError(409, "CMS_MEDIA_UPLOAD_INCOMPLETE");
    const { data: original, error: downloadError } = await bucket.download(asset.path, {}, { signal: AbortSignal.timeout(7000) });
    if (downloadError || !original) throw unavailable();
    if (original.size !== asset.bytes) throw new AccountApiError(422, "CMS_INVALID_IMAGE");
    const image = await processCmsImage(Buffer.from(await original.arrayBuffer()), asset.mimeType, asset.role);
    const path = `derived/${assetId}/${image.sha256}.webp`;
    const result = await bucket.upload(path, image.bytes, { contentType: "image/webp", cacheControl: "60", upsert: false });
    if (result.error) {
      // If the previous response was lost, the service-owned content-addressed
      // object is already safe to reuse without enabling overwrite.
      const existing = await bucket.info(path);
      if (existing.error || !existing.data) throw unavailable();
    }
    finalized = await accessAsset(actor, "finish", {
      assetId, processingToken: token, sha256: image.sha256, width: image.width, height: image.height,
      originalBytes: original.size, derivativeBytes: image.bytes.length,
    });
  } catch (error) {
    await accessAsset(actor, "releaseProcessing", {
      assetId, processingToken: token, invalidImage: error instanceof AccountApiError && error.code === "CMS_INVALID_IMAGE",
    }).catch(() => { /* The bounded lease also permits recovery after a process failure. */ });
    throw error;
  }
  return signAssetPreview(finalized);
}

/** Download only content-addressed derivatives from the exact approved snapshots. */
export async function materializePublisherMedia(actor: CmsActor, approvalIds: readonly string[]) {
  if (!approvalIds.length) return [];
  if (approvalIds.length > 200 || !approvalIds.every(isAssetId)) throw unavailable();
  const client = getAccountServiceClient();
  const call = client.rpc.bind(client) as unknown as (name: string, args: Record<string, unknown>) =>
    PromiseLike<{ data: unknown; error: { code: string } | null }>;
  const { data, error } = await call("cms_approved_media_inputs", {
    p_actor: actor.userId, p_session: actor.sessionId, p_approval_ids: approvalIds,
  });
  if (error || !Array.isArray(data)) throw unavailable();
  const bytes = data.reduce((total, asset) => total + (Number.isSafeInteger(asset?.derivativeBytes) ? asset.derivativeBytes : Infinity), 0);
  if (bytes > 25 * 1024 * 1024) throw new AccountApiError(409, "CMS_RELEASE_MEDIA_TOO_LARGE");
  const bucket = client.storage.from(PRIVATE_BUCKET);
  const { createHash } = await import("node:crypto");
  const files = [];
  for (const asset of data) {
    if (!isAssetId(asset?.assetId) || !approvalIds.includes(asset.approvalId)
      || typeof asset.toolId !== "string" || !mediaRoles.includes(asset.role)
      || typeof asset.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(asset.sha256)) throw unavailable();
    const suffix = `${asset.assetId}/${asset.sha256}.webp`;
    const { data: image, error: readError } = await bucket.download("derived/" + suffix, {}, { signal: AbortSignal.timeout(6000) });
    if (readError || !image || image.size !== asset.derivativeBytes) throw unavailable();
    const output = Buffer.from(await image.arrayBuffer());
    if (createHash("sha256").update(output).digest("hex") !== asset.sha256) throw unavailable();
    const url = "/tool-media/cms/" + suffix;
    files.push({
      assetId: asset.assetId, approvalId: String(asset.approvalId), toolId: String(asset.toolId),
      role: asset.role as MediaRole, sha256: asset.sha256, path: "public" + url, url, bytes: output,
    });
  }
  return files;
}
