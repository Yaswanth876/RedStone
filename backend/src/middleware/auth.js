
import jwt from "jsonwebtoken";
import prisma from "../db.js";

/**
 * Middleware: require a valid JWT Bearer token.
 * On success, attaches the full user row (minus passwordHash) to req.user.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.length <= 7) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.slice(7);

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || typeof payload !== "object" || typeof payload.sub !== "string") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(500).json({ error: "Authentication failed" });
  }
}
