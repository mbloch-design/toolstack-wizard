import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";
import { AccountApiError, requireAccount } from "./_account-auth.js";
import { readAccountBody } from "./_account-body.js";
import { isMediaMime, MAX_ORIGINAL_BYTES, mediaRoles, type MediaRole } from "./_catalog-media-image.js";
import { finalizeAsset, getAssetPreview, isAssetId, reserveAsset, type ReserveMetadata } from "./_catalog-media.js";

export const config = { api: { bodyParser: false } };
const invalid = () => new AccountApiError(400, "CMS_INVALID_MEDIA_REQUEST");
const record = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw invalid();
  return input as Record<string, unknown>;
};

export function parseMediaCommand(input: unknown): ({ action: "reserve" } & ReserveMetadata) | { action: "finalize"; assetId: string } {
  const body = record(input);
  if (body.action === "finalize" && Object.keys(body).length === 2 && isAssetId(body.assetId)) {
    return { action: "finalize", assetId: body.assetId };
  }
  if (body.action !== "reserve" || Object.keys(body).some((key) =>
    !["action", "target", "role", "mimeType", "bytes", "idempotencyKey", "replaceAssetId"].includes(key))) throw invalid();
  const target = record(body.target);
  const { kind, id } = target;
  const { role, mimeType, bytes, idempotencyKey, replaceAssetId } = body;
  if (Object.keys(target).length !== 2 || (kind !== "listing" && kind !== "tool") || typeof id !== "string"
    || (kind === "listing" ? !isAssetId(id) : !id.trim() || id.length > 200)
    || !mediaRoles.includes(role as MediaRole) || !isMediaMime(mimeType)
    || typeof bytes !== "number" || !Number.isInteger(bytes) || bytes < 1 || bytes > MAX_ORIGINAL_BYTES
    || typeof idempotencyKey !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(idempotencyKey)
    || (replaceAssetId !== undefined && (typeof replaceAssetId !== "string" || !replaceAssetId || replaceAssetId.length > 160))) throw invalid();
  return { action: "reserve", target: { kind, id: kind === "listing" ? id.toLowerCase() : id }, role: role as MediaRole,
    mimeType, bytes, idempotencyKey, ...(replaceAssetId && { replaceAssetId }) };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } });
    return;
  }
  try {
    if (process.env.PUBLISHER_CMS_ENABLED !== "true") throw new AccountApiError(503, "CMS_MEDIA_UNAVAILABLE");
    const actor = await requireAccount(req);
    if (!actor.emailConfirmed) throw new AccountApiError(403, "CMS_ACCESS_DENIED");
    if (req.method === "GET") {
      const assetId = req.query.assetId;
      if (!isAssetId(assetId) || Object.keys(req.query).length !== 1) throw invalid();
      res.status(200).json(await getAssetPreview(actor, assetId.toLowerCase()));
      return;
    }
    const command = parseMediaCommand(await readAccountBody(req, 4096, "CMS_INVALID_MEDIA_REQUEST"));
    if (command.action === "finalize") {
      res.status(200).json(await finalizeAsset(actor, command.assetId.toLowerCase()));
      return;
    }
    const { action, ...metadata } = command;
    res.status(200).json(await reserveAsset(actor, metadata));
  } catch (cause) {
    const error = cause instanceof AccountApiError ? cause : new AccountApiError(503, "CMS_MEDIA_UNAVAILABLE");
    res.status(error.status).json({ error: { code: error.code } });
  }
}
