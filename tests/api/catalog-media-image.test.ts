import { createHash } from "node:crypto";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const createRaster = (width: number, height: number) => sharp({ create: {
  width, height, channels: 4, background: { r: 40, g: 100, b: 220, alpha: 0.4 },
} });

describe("CMS raster validation", () => {
  it("re-encodes a PNG as bounded, alpha-preserving WebP with a reproducible hash", async () => {
    const { processCmsImage } = await import("../../api/_catalog-media-image.js");
    const png = await createRaster(1024, 768).png().withMetadata().toBuffer();
    const result = await processCmsImage(png, "image/png", "logo");
    const details = await sharp(result.bytes).metadata();
    expect(details).toMatchObject({ format: "webp", width: 512, height: 384, hasAlpha: true });
    expect(details.exif).toBeUndefined();
    expect(result.sha256).toBe(createHash("sha256").update(result.bytes).digest("hex"));
  });

  it("rejects disguised SVG and mislabeled PNG", async () => {
    const { processCmsImage } = await import("../../api/_catalog-media-image.js");
    const png = await createRaster(5, 5).png().toBuffer();
    await expect(processCmsImage(png, "image/jpeg", "gallery")).rejects.toThrow("CMS_INVALID_IMAGE");
    await expect(processCmsImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), "image/png", "logo"))
      .rejects.toThrow("CMS_INVALID_IMAGE");
  });

  it("rejects corrupted or animated PNG, and uses bytes and megapixels as independent limits", async () => {
    const { processCmsImage } = await import("../../api/_catalog-media-image.js");
    const small = await createRaster(10, 10).png().toBuffer();
    const animated = Buffer.concat([small.subarray(0, 33), Buffer.from([0, 0, 0, 8, 97, 99, 84, 76]), Buffer.alloc(12), small.subarray(33)]);
    const bomb = await createRaster(5000, 4100).png().toBuffer();
    for (const input of [small.subarray(0, 40), animated, bomb, Buffer.alloc(5 * 1024 * 1024 + 1)]) {
      await expect(processCmsImage(input, "image/png", "gallery")).rejects.toThrow("CMS_INVALID_IMAGE");
    }
  });
});
