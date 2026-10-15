import sharp from "sharp";

/**
 * Image Processing & Validation Service for Timetable OCR
 *
 * Validates:
 * - Magic bytes (file signatures) for PNG, JPEG, and WebP
 * - Image integrity and decoding via Sharp
 * - Safe image dimensions (min 50x50, max 8000x8000, max 25 megapixels)
 *
 * Preprocessing:
 * - Orientation correction via EXIF
 * - Bounded resizing (downscale large images to max 2400px; upscale small images for legibility)
 * - Grayscale conversion
 * - Contrast normalization
 * - Edge sharpening
 */

export const MAX_IMAGE_PIXELS = 25 * 1000 * 1000; // 25 Megapixels
export const MAX_DIMENSION = 8000;
export const MIN_DIMENSION = 50;

/**
 * Check if buffer starts with valid image signature.
 * @param {Buffer} buffer
 * @param {string} extension
 * @returns {boolean}
 */
export function verifyImageSignature(buffer, extension) {
  if (!buffer || buffer.length < 8) return false;

  const ext = extension.toLowerCase();

  if (ext === ".png") {
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (ext === ".jpg" || ext === ".jpeg") {
    // JPEG signature starts with FF D8 FF
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (ext === ".webp") {
    // WebP signature: "RIFF" at offset 0, "WEBP" at offset 8
    if (buffer.length < 12) return false;
    const riff = buffer.subarray(0, 4).toString("ascii");
    const webp = buffer.subarray(8, 12).toString("ascii");
    return riff === "RIFF" && webp === "WEBP";
  }

  return false;
}

/**
 * Inspect image metadata and validate safe dimensions and non-corrupt status.
 *
 * @param {Buffer} buffer
 * @returns {Promise<{ width: number, height: number, format: string }>}
 */
export async function validateImageMetadata(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Unable to read image dimensions");
    }

    if (metadata.width < MIN_DIMENSION || metadata.height < MIN_DIMENSION) {
      const err = new Error(
        `Image dimensions (${metadata.width}x${metadata.height}) are too small for timetable recognition. Minimum size is ${MIN_DIMENSION}x${MIN_DIMENSION} pixels.`
      );
      err.status = 400;
      throw err;
    }

    if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
      const err = new Error(
        `Image dimensions (${metadata.width}x${metadata.height}) exceed maximum allowed dimension of ${MAX_DIMENSION} pixels.`
      );
      err.status = 400;
      throw err;
    }

    const totalPixels = metadata.width * metadata.height;
    if (totalPixels > MAX_IMAGE_PIXELS) {
      const err = new Error(
        `Image total resolution (${Math.round(totalPixels / 1000000)} MP) exceeds maximum allowed limit of 25 megapixels.`
      );
      err.status = 400;
      throw err;
    }

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    };
  } catch (err) {
    if (err.status) throw err;
    const corruptErr = new Error(`Image file is corrupt or unreadable: ${err.message}`);
    corruptErr.status = 400;
    throw corruptErr;
  }
}

/**
 * Preprocess image for optimal Tesseract OCR extraction.
 *
 * @param {Buffer} buffer - Original image buffer
 * @returns {Promise<{ processedBuffer: Buffer, metadata: object }>}
 */
export async function preprocessImageForOcr(buffer) {
  const metadata = await validateImageMetadata(buffer);

  let pipeline = sharp(buffer)
    .rotate() // Auto-orient based on EXIF
    .grayscale(); // Convert to single-channel luminance

  // Resize bounds: optimal resolution for OCR is around 1800-2400px wide
  if (metadata.width > 2400 || metadata.height > 2400) {
    pipeline = pipeline.resize({
      width: metadata.width >= metadata.height ? 2400 : undefined,
      height: metadata.height > metadata.width ? 2400 : undefined,
      fit: "inside",
      withoutEnlargement: true,
    });
  } else if (metadata.width < 1000 && metadata.height < 1000) {
    // Upscale small timetable images to improve character detection
    pipeline = pipeline.resize({
      width: Math.round(metadata.width * 1.5),
      height: Math.round(metadata.height * 1.5),
      fit: "inside",
    });
  }

  // Normalize contrast and enhance edges
  const processedBuffer = await pipeline
    .normalize()
    .sharpen({ sigma: 1, m1: 0.5, m2: 0.5 })
    .png()
    .toBuffer();

  return { processedBuffer, metadata };
}
