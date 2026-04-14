import { Router } from "express";
import { z } from "zod";
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
  category: z.enum(["career", "finance", "health", "travel", "relationships", "skills", "other"]).default("other"),
  year: z.number().int().min(2000).max(2100).optional().nullable(),
  position: z.number().int().min(0).default(0),
  imageUrl: z.string().optional()
});

router.use(requireAuth);

router.get("/", validateQuery(z.object({ category: z.string().optional() })), async (req, res) => {
  const images = await prisma.visionImage.findMany({
    where: {
      userId: req.user!.id,
      ...(req.query.category ? { category: String(req.query.category) as never } : {})
    },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }]
  });
  res.json(images);
});

router.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "Please choose an image to upload." });
    return;
  }

  res.status(201).json({
    imageUrl: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname
  });
});

router.post("/", validateBody(visionSchema.extend({ imageUrl: z.string().min(1) })), async (req, res) => {
  const payload = req.body as z.infer<typeof visionSchema> & { imageUrl: string };
  const image = await prisma.visionImage.create({
    data: {
      ...payload,
      title: payload.title ? sanitizePlainText(payload.title) : null,
      affirmation: payload.affirmation ? sanitizePlainText(payload.affirmation) : null,
      userId: req.user!.id
    }
  });
  res.status(201).json(image);
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
  const deleted = await prisma.visionImage.deleteMany({
    where: { id: imageId, userId: req.user!.id }
  });

  if (deleted.count === 0) {
    throw new ApiError(404, "Vision image not found.");
  }

  res.status(204).send();
});

export default router;
