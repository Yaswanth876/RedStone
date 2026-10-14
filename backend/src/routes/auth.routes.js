
import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
}).strict();

const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
}).strict();

/** Sign a JWT for a given user id */
function signToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Invalid registration data",
      details: result.error.issues,
    });
  }

  const { name, email, password } = result.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    const token = signToken(user.id);

    return res.status(201).json({ message: "Account created", token, user });
  } catch (error) {
    console.error("Registration failed:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Invalid login data",
      details: result.error.issues,
    });
  }

  const { email, password } = result.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user.id);

    const { passwordHash: _omit, ...safeUser } = user;

    return res.status(200).json({ token, user: safeUser });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

export default router;
