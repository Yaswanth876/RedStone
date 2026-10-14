import multer from "multer";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export function notFoundHandler(req, res) {
  return res.status(404).json({ error: "Route not found" });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ error: "Malformed JSON request body" });
  }
  if (error instanceof ZodError) {
    return res.status(400).json({ error: "Invalid request data", details: error.issues });
  }
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File exceeds the upload size limit" });
    }
    if (error.status === 415) {
      return res.status(415).json({ error: "Unsupported file type" });
    }
    return res.status(400).json({ error: "Invalid file upload" });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return res.status(409).json({ error: "A record with that value already exists" });
    if (error.code === "P2025") return res.status(404).json({ error: "Requested record was not found" });
  }

  console.error("Unhandled request error:", error);
  return res.status(500).json({ error: "Internal server error" });
}
