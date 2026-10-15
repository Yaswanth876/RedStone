import test, { describe } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  verifyImageSignature,
  validateImageMetadata,
  preprocessImageForOcr,
} from "../src/services/image-processor.js";

describe("Image Processor & Security Validation Tests", () => {
  describe("File Signatures (Magic Bytes)", () => {
    test("verifies valid PNG signatures", async () => {
      const pngBuffer = await sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 255, b: 255 } },
      })
        .png()
        .toBuffer();

      assert.equal(verifyImageSignature(pngBuffer, ".png"), true);
      assert.equal(verifyImageSignature(pngBuffer, ".jpg"), false);
    });

    test("verifies valid JPEG signatures", async () => {
      const jpegBuffer = await sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 255, b: 255 } },
      })
        .jpeg()
        .toBuffer();

      assert.equal(verifyImageSignature(jpegBuffer, ".jpg"), true);
      assert.equal(verifyImageSignature(jpegBuffer, ".jpeg"), true);
      assert.equal(verifyImageSignature(jpegBuffer, ".png"), false);
    });

    test("verifies valid WebP signatures", async () => {
      const webpBuffer = await sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 255, b: 255 } },
      })
        .webp()
        .toBuffer();

      assert.equal(verifyImageSignature(webpBuffer, ".webp"), true);
      assert.equal(verifyImageSignature(webpBuffer, ".png"), false);
    });

    test("rejects spoofed or corrupted signatures", () => {
      const fakeBuffer = Buffer.from("this is a fake text file claiming to be an image");
      assert.equal(verifyImageSignature(fakeBuffer, ".png"), false);
      assert.equal(verifyImageSignature(fakeBuffer, ".jpg"), false);
      assert.equal(verifyImageSignature(fakeBuffer, ".webp"), false);
      assert.equal(verifyImageSignature(Buffer.alloc(0), ".png"), false);
      assert.equal(verifyImageSignature(null, ".png"), false);
    });
  });

  describe("Image Dimension & Security Metadata Checks", () => {
    test("accepts valid dimensions", async () => {
      const valid = await sharp({
        create: { width: 300, height: 200, channels: 3, background: { r: 255, g: 255, b: 255 } },
      })
        .png()
        .toBuffer();

      const metadata = await validateImageMetadata(valid);
      assert.equal(metadata.width, 300);
      assert.equal(metadata.height, 200);
      assert.equal(metadata.format, "png");
    });

    test("rejects images smaller than 50x50 pixels", async () => {
      const tooSmall = await sharp({
        create: { width: 30, height: 30, channels: 3, background: { r: 255, g: 255, b: 255 } },
      })
        .png()
        .toBuffer();

      await assert.rejects(
        () => validateImageMetadata(tooSmall),
        (err) => err.status === 400 && err.message.includes("too small")
      );
    });

    test("rejects corrupted image data", async () => {
      const corrupt = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02]);
      await assert.rejects(
        () => validateImageMetadata(corrupt),
        (err) => err.status === 400 && err.message.includes("corrupt")
      );
    });
  });

  describe("Preprocessing Pipeline", () => {
    test("converts image to grayscale, sharpens, and scales appropriately", async () => {
      const input = await sharp({
        create: { width: 800, height: 600, channels: 3, background: { r: 200, g: 100, b: 50 } },
      })
        .png()
        .toBuffer();

      const { processedBuffer, metadata } = await preprocessImageForOcr(input);
      assert.ok(processedBuffer instanceof Buffer);
      assert.ok(processedBuffer.length > 0);

      // Verify processed image is valid PNG
      const processedMeta = await sharp(processedBuffer).metadata();
      assert.equal(processedMeta.format, "png");
      assert.equal(processedMeta.channels, 1); // Grayscale has 1 channel
    });
  });
});
