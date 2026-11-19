import { createHash } from "node:crypto";
import sharp from "sharp";
import { AccountApiError } from "./_account-auth.js";

export const MAX_ORIGINAL_BYTES = 5 * 1024 * 1024;
const MAX_DERIVATIVE_BYTES = 2 * 1024 * 1024;
const MAX_PIXELS = 20_000_000;
const formats = { "image/png": "png", "image/jpeg": "jpeg", "image/webp": "webp" } as const;
export type MediaMime = keyof typeof formats;
export const isMediaMime = (value: unknown): value is MediaMime => typeof value === "string" && Object.prototype.hasOwnProperty.call(formats, value);
export const mediaRoles = ["logo", "cover", "gallery"] as const;
export type MediaRole = typeof mediaRoles[number];
const dimensions = { logo: [512, 512], gallery: [1920, 1920], cover: [1200, 630] } as const;
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const invalidImage = () => new AccountApiError(422, "CMS_INVALID_IMAGE");

function acceptsRaster(input: Buffer, mimeType: MediaMime) {
  if (mimeType === "image/jpeg") return input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff;
  if (mimeType === "image/webp") {
    return input.toString("ascii", 0, 4) === "RIFF" && input.toString("ascii", 8, 12) === "WEBP";
  }
  if (!input.subarray(0, 8).equals(pngSignature)) return false;
  // libpng can silently decode the first frame of APNG. Check the container too.
  for (let offset = 8; offset + 12 <= input.length;) {
    const size = input.readUInt32BE(offset);
    const kind = input.toString("ascii", offset + 4, offset + 8);
    offset += size + 12;
    if (offset > input.length || kind === "acTL" || kind === "fcTL" || kind === "fdAT") return false;
    if (kind === "IEND") return size === 0;
  }
  return false;
}

export async function processCmsImage(input: Buffer, mimeType: MediaMime, role: MediaRole) {
  if (!input.length || input.length > MAX_ORIGINAL_BYTES || !acceptsRaster(input, mimeType)) throw invalidImage();
  try {
    const source = sharp(input, { limitInputPixels: MAX_PIXELS, failOn: "warning", sequentialRead: true, pages: 1 });
    const metadata = await source.metadata();
    if (metadata.format !== formats[mimeType] || (metadata.pages ?? 1) > 1 || !metadata.width || !metadata.height
      || metadata.width * metadata.height > MAX_PIXELS) throw invalidImage();
    const [width, height] = dimensions[role];
    const resized = source.rotate().resize({ width, height, withoutEnlargement: true, fit: role === "cover" ? "cover" : "inside" });
    let result = await resized.clone().timeout({ seconds: 3 }).webp({ quality: 84, effort: 3 }).toBuffer({ resolveWithObject: true });
    if (result.data.length > MAX_DERIVATIVE_BYTES) {
      result = await resized.clone().timeout({ seconds: 3 }).webp({ quality: 70, effort: 3 }).toBuffer({ resolveWithObject: true });
    }
    if (result.data.length > MAX_DERIVATIVE_BYTES) throw invalidImage();
    return { bytes: result.data, width: result.info.width, height: result.info.height,
      sha256: createHash("sha256").update(result.data).digest("hex") };
  } catch { throw invalidImage(); }
}
