import type { VercelRequest } from "../types/vercel-http.js";
import { AccountApiError } from "./_account-auth.js";

export async function readAccountBody(req: VercelRequest, maxBytes: number, invalidCode: string): Promise<unknown> {
  const length = req.headers["content-length"];
  if (length !== undefined && (typeof length !== "string" || !/^\d+$/.test(length))) throw new AccountApiError(400, invalidCode);
  if (length && Number(length) > maxBytes) throw new AccountApiError(413, "PAYLOAD_TOO_LARGE");
  let raw: string;
  const descriptor = Object.getOwnPropertyDescriptor(req, "body");
  const suppliedBody = descriptor && "value" in descriptor ? descriptor.value : undefined;
  if (suppliedBody !== undefined) {
    // Parsed bodies occur in adapters/tests. Never JSON-clone them: NaN/Infinity must be rejected as such.
    if (typeof suppliedBody !== "string" && !Buffer.isBuffer(suppliedBody)) {
      if (Buffer.byteLength(JSON.stringify(suppliedBody) ?? "") > maxBytes) throw new AccountApiError(413, "PAYLOAD_TOO_LARGE");
      return suppliedBody;
    }
    if (Buffer.byteLength(suppliedBody) > maxBytes) throw new AccountApiError(413, "PAYLOAD_TOO_LARGE");
    raw = suppliedBody.toString();
  } else {
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const chunk of req) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += buffer.byteLength;
      if (bytes > maxBytes) throw new AccountApiError(413, "PAYLOAD_TOO_LARGE");
      chunks.push(buffer);
    }
    raw = Buffer.concat(chunks).toString("utf8");
  }
  try { return JSON.parse(raw); } catch { throw new AccountApiError(400, invalidCode); }
}
