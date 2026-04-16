import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../utils/db.js";
import { validateBody } from "../middleware/validate.js";
import { ApiError } from "../middleware/errorHandler.js";
import { signAuthToken } from "../utils/jwtHelpers.js";
import { requireAuth } from "../middleware/auth.js";
import cloudinary from "../lib/cloudinary.js";
import { env } from "../utils/env.js";
const router = Router();

const authSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

router.post(
  "/register",
  validateBody(authSchema.extend({ name: z.string().min(2).max(80) })),
  async (req, res) => {
    const existingUser = await prisma.user.findUnique({ where: { email: req.body.email } });

    if (existingUser) {
      throw new ApiError(409, "An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        passwordHash,
        settings: {
          theme: "parchment",
          fontSize: "medium",
          firstDayOfWeek: "monday",
          currency: "INR",
          sidebarCollapsed: false
        }
      }
    });

    const token = signAuthToken({ sub: user.id, email: user.email, name: user.name });
    res.cookie("lifeos_token", token, {
      httpOnly: true,
      sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
      secure: env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, settings: user.settings }
    });
  }
);

router.post("/login", validateBody(authSchema.pick({ email: true, password: true })), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });

  if (!user) {
    throw new ApiError(401, "Email or password is incorrect.");
  }

  const isValid = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!isValid) {
    throw new ApiError(401, "Email or password is incorrect.");
  }

  const token = signAuthToken({ sub: user.id, email: user.email, name: user.name });
  res.cookie("lifeos_token", token, {
    httpOnly: true,
    sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, settings: user.settings }
  });
});

router.post("/logout", (_req, res) => {
  res.clearCookie("lifeos_token");
  res.status(204).send();
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, profilePhoto: true, settings: true }
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  res.json(user);
});

// Helper to extract Cloudinary public ID from URL
const extractPublicId = (url: string) => {
  const parts = url.split("/");
  const folderParts = parts.slice(parts.indexOf("lifeos"));
  const lastPart = folderParts[folderParts.length - 1].split(".")[0];
  folderParts[folderParts.length - 1] = lastPart;
  return folderParts.join("/");
};

router.delete("/account", requireAuth, async (req, res) => {
  const { password } = req.body;
  if (!password) {
    throw new ApiError(400, "Password is required to delete account.");
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new ApiError(401, "Invalid password. Deletion aborted.");
  }

  // 1. Fetch and destroy user images from Cloudinary
  const images = await prisma.visionImage.findMany({ 
    where: { userId: req.user!.id },
    select: { imageUrl: true }
  });
  
  for (const img of images) {
    if (img.imageUrl) {
      try {
        const publicId = extractPublicId(img.imageUrl);
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error("Failed to destroy image during account deletion:", err);
      }
    }
  }

  // 2. Delete user (Prisma cascade handles relations)
  await prisma.user.delete({
    where: { id: req.user!.id }
  });

  res.clearCookie("lifeos_token");
  res.status(200).json({ message: "Account successfully deleted." });
});

export default router;
