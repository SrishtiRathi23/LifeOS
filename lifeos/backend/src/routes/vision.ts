import { Router } from "express";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { prisma } from "../utils/db.js";
import { sanitizePlainText } from "../utils/sanitize.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = Router();

const visionSchema = z.object({
  title: z.string().max(120).optional().nullable(),
  affirmation: z.string().max(300).optional().nullable(),
  category: z.string().max(50).default("Other"),
  year: z.string().default("2026"),
  position: z.number().int().min(0).default(0)
});

const settingsSchema = z.object({
  layout: z.string().default("polaroid"),
  background: z.string().default("#FDF6EE"),
  frameStyle: z.string().default("polaroid"),
  moodFilter: z.string().default("none"),
  decorativeTheme: z.string().optional().nullable(),
  aspectRatio: z.string().default("portrait"),
  boardTitle: z.string().default("My Vision Board 2026"),
  textOverlays: z.any().optional()
});

router.use(requireAuth);

router.get("/settings", async (req, res) => {
  let settings = await prisma.visionBoardSettings.findUnique({
    where: { userId: req.user!.id }
  });
  if (!settings) {
    settings = await prisma.visionBoardSettings.create({
      data: { userId: req.user!.id }
    });
  }
  res.json(settings);
});

router.put("/settings", validateBody(settingsSchema.partial()), async (req, res) => {
  const payload = req.body;
  const settings = await prisma.visionBoardSettings.upsert({
    where: { userId: req.user!.id },
    create: { ...payload, userId: req.user!.id },
    update: payload
  });
  res.json(settings);
});

router.get("/", async (req, res) => {
  const images = await prisma.visionImage.findMany({
    where: { userId: req.user!.id },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }]
  });
  res.json(images);
});

router.post("/", upload.single("image"), async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Please choose an image to upload.");
  }
  
  const parsedBody = {
    title: req.body.title || null,
    affirmation: req.body.affirmation || null,
    category: req.body.category || "Other",
    year: req.body.year || "2026",
    position: req.body.position ? Number(req.body.position) : 0
  };

  const image = await prisma.visionImage.create({
    data: {
      ...parsedBody,
      title: parsedBody.title ? sanitizePlainText(parsedBody.title) : null,
      affirmation: parsedBody.affirmation ? sanitizePlainText(parsedBody.affirmation) : null,
      filename: req.file.filename,
      userId: req.user!.id
    }
  });
  
  res.status(201).json(image);
});

router.patch("/reorder", validateBody(z.array(z.object({ id: z.string(), position: z.number() }))), async (req, res) => {
  const updates = req.body;
  await prisma.$transaction(
    updates.map((update) =>
      prisma.visionImage.updateMany({
        where: { id: update.id, userId: req.user!.id },
        data: { position: update.position }
      })
    )
  );
  res.status(204).send();
});

router.patch("/:id/image", upload.single("image"), async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Please choose an image to upload.");
  }
  const imageId = String(req.params.id);
  const existingImage = await prisma.visionImage.findFirst({
    where: { id: imageId, userId: req.user!.id }
  });

  if (!existingImage) {
    throw new ApiError(404, "Vision image not found.");
  }

  const oldPath = path.resolve("uploads", existingImage.filename);
  if (fs.existsSync(oldPath)) {
    fs.unlinkSync(oldPath);
  }

  const updated = await prisma.visionImage.update({
    where: { id: imageId },
    data: { filename: req.file.filename }
  });

  res.json(updated);
});

router.patch("/:id", validateBody(visionSchema.partial()), async (req, res) => {
  const imageId = String(req.params.id);
  const payload = req.body as Partial<z.infer<typeof visionSchema>>;
  const existingImage = await prisma.visionImage.findFirst({
    where: { id: imageId, userId: req.user!.id }
  });

  if (!existingImage) {
    throw new ApiError(404, "Vision image not found.");
  }

  const image = await prisma.visionImage.update({
    where: { id: imageId },
    data: {
      ...payload,
      title: payload.title ? sanitizePlainText(payload.title) : payload.title,
      affirmation: payload.affirmation ? sanitizePlainText(payload.affirmation) : payload.affirmation
    }
  });
  res.json(image);
});

router.delete("/:id", async (req, res) => {
  const imageId = String(req.params.id);
  const existingImage = await prisma.visionImage.findFirst({
    where: { id: imageId, userId: req.user!.id }
  });

  if (!existingImage) {
    throw new ApiError(404, "Vision image not found.");
  }

  const oldPath = path.resolve("uploads", existingImage.filename);
  if (fs.existsSync(oldPath)) {
    fs.unlinkSync(oldPath);
  }

  await prisma.visionImage.delete({
    where: { id: imageId }
  });

  res.status(204).send();
});

export default router;
