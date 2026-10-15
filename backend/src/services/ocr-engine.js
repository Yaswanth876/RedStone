import { createWorker } from "tesseract.js";
import path from "path";
import fs from "fs";

/**
 * OCR Engine configuration for Render free tier:
 * - Worker reuse to avoid 2-4 second re-initialization and memory churn per request.
 * - Single-task concurrency queue to prevent OOM spikes on Render's 512MB RAM.
 * - Enforced execution timeout to prevent hanging OCR workers.
 */
const OCR_TIMEOUT_MS = Number(process.env.OCR_TIMEOUT_MS) || 45000;

class OcrEngine {
  constructor() {
    this.worker = null;
    this.isInitializing = false;
    this.initPromise = null;
    this.queue = [];
    this.isProcessing = false;
  }

  /**
   * Initialize or retrieve the active reusable Tesseract.js worker.
   */
  async getWorker() {
    if (this.worker) {
      return this.worker;
    }

    if (this.isInitializing) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        // Tesseract worker with English language model
        const worker = await createWorker("eng");
        this.worker = worker;
        return worker;
      } catch (err) {
        this.worker = null;
        throw new Error(`Failed to initialize Tesseract OCR engine: ${err.message}`);
      } finally {
        this.isInitializing = false;
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Enqueue an OCR recognition task. Serializes OCR execution so only one job
   * runs at a time to stay within Render memory constraints.
   *
   * @param {Buffer} imageBuffer - Preprocessed image buffer
   * @param {object} [options]
   * @param {number} [options.timeoutMs]
   * @returns {Promise<{ text: string, confidence: number, lines: Array, words: Array, blocks: Array }>}
   */
  async recognize(imageBuffer, options = {}) {
    const timeoutMs = options.timeoutMs || OCR_TIMEOUT_MS;

    return new Promise((resolve, reject) => {
      this.queue.push({
        imageBuffer,
        timeoutMs,
        resolve,
        reject,
      });

      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const task = this.queue.shift();

    let timeoutTimer = null;

    try {
      const worker = await this.getWorker();

      const timeoutPromise = new Promise((_, reject) => {
        timeoutTimer = setTimeout(() => {
          const err = new Error(`OCR processing timed out after ${task.timeoutMs}ms`);
          err.code = "OCR_TIMEOUT";
          reject(err);
        }, task.timeoutMs);
      });

      const ocrPromise = worker.recognize(task.imageBuffer);

      const result = await Promise.race([ocrPromise, timeoutPromise]);
      clearTimeout(timeoutTimer);

      const data = result.data || {};
      task.resolve({
        text: data.text || "",
        confidence: typeof data.confidence === "number" ? data.confidence : 0,
        lines: (data.lines || []).map((line) => ({
          text: line.text || "",
          confidence: line.confidence || 0,
          bbox: line.bbox || null,
          words: (line.words || []).map((w) => ({
            text: w.text || "",
            confidence: w.confidence || 0,
            bbox: w.bbox || null,
          })),
        })),
        words: (data.words || []).map((w) => ({
          text: w.text || "",
          confidence: w.confidence || 0,
          bbox: w.bbox || null,
        })),
        blocks: data.blocks || [],
      });
    } catch (err) {
      clearTimeout(timeoutTimer);

      // If the worker timed out or crashed, terminate and invalidate it so
      // subsequent requests create a clean worker.
      if (err.code === "OCR_TIMEOUT" || (this.worker && this.worker.crashed)) {
        await this.terminate().catch(() => {});
      }

      task.reject(err);
    } finally {
      this.isProcessing = false;
      // Continue with remaining tasks in queue
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Terminate active worker and release memory.
   */
  async terminate() {
    if (this.worker) {
      const w = this.worker;
      this.worker = null;
      try {
        await w.terminate();
      } catch (err) {
        console.warn("Error terminating OCR worker:", err.message);
      }
    }
  }
}

export const ocrEngine = new OcrEngine();

// Graceful cleanup on server shutdown
process.on("SIGINT", () => ocrEngine.terminate());
process.on("SIGTERM", () => ocrEngine.terminate());
