import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { prisma } from "../utils/db.js";
import { reflectOnDiaryEntry } from "../utils/claudeClient.js";
import { sanitize, sanitizePlainText, sanitizeRichText } from "../utils/sanitize.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = Router();

const diarySchema = z.object({
  date: z.string().datetime(),
  content: z.string().min(1),
  mood: z.number().int().min(1).max(5).optional().nullable(),
  weather: z.string().max(80).optional().nullable(),
  gratitude: z.array(z.string()).max(3).optional().default([]),
  tomorrowPlan: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).default([]),
  photos: z.array(z.string()).max(3).optional().default([])
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const entries = await prisma.diaryEntry.findMany({
    where: { userId: req.user!.id },
    orderBy: { date: "desc" }
  });
  res.json(entries);
});

router.get("/search", validateQuery(z.object({ q: z.string().min(1) })), async (req, res) => {
  const query = String(req.query.q);
  const entries = await prisma.diaryEntry.findMany({
    where: {
      userId: req.user!.id,
      OR: [{ content: { contains: query, mode: "insensitive" } }, { tags: { has: query } }]
    },
    orderBy: { date: "desc" }
  });
  res.json(entries);
});

router.post("/", validateBody(diarySchema), async (req, res) => {
  const payload = req.body as z.infer<typeof diarySchema>;
  const entry = await prisma.diaryEntry.upsert({
    where: {
      userId_date: {
        userId: req.user!.id,
        date: new Date(payload.date)
      }
    },
    update: {
      content: sanitizeRichText(payload.content),
      mood: payload.mood,
      weather: payload.weather ? sanitizePlainText(payload.weather) : null,
      gratitude: payload.gratitude.map(sanitizePlainText),
      tomorrowPlan: payload.tomorrowPlan.map(sanitizePlainText),
      tags: payload.tags.map(sanitizePlainText),
      photos: payload.photos
    },
    create: {
      userId: req.user!.id,
      date: new Date(payload.date),
      content: sanitizeRichText(payload.content),
      mood: payload.mood,
      weather: payload.weather ? sanitizePlainText(payload.weather) : null,
      gratitude: payload.gratitude.map(sanitizePlainText),
      tomorrowPlan: payload.tomorrowPlan.map(sanitizePlainText),
      tags: payload.tags.map(sanitizePlainText),
      photos: payload.photos
    }
  });

  res.status(201).json(entry);
});

router.patch("/:id", validateBody(diarySchema.partial()), async (req, res) => {
  const entryId = String(req.params.id);
  const payload = req.body as Partial<z.infer<typeof diarySchema>>;
  const existingEntry = await prisma.diaryEntry.findFirst({
    where: { id: entryId, userId: req.user!.id }
  });

  if (!existingEntry) {
    throw new ApiError(404, "Diary entry not found.");
  }

  const entry = await prisma.diaryEntry.update({
    where: { id: entryId },
    data: {
      content: payload.content ? sanitizeRichText(payload.content) : undefined,
      mood: payload.mood,
      weather: payload.weather ? sanitizePlainText(payload.weather) : payload.weather,
      gratitude: payload.gratitude?.map(sanitizePlainText),
      tomorrowPlan: payload.tomorrowPlan?.map(sanitizePlainText),
      tags: payload.tags?.map(sanitizePlainText),
      photos: payload.photos
    }
  });
  res.json(entry);
});

router.delete("/:id", async (req, res) => {
  const entryId = String(req.params.id);
  const deleted = await prisma.diaryEntry.deleteMany({
    where: { id: entryId, userId: req.user!.id }
  });

  if (deleted.count === 0) {
    throw new ApiError(404, "Diary entry not found.");
  }

  res.status(204).send();
});

const diaryAILimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "You have reached the hourly AI limit. Please try again later." }
});

router.post("/:id/ai-reflect", diaryAILimiter, async (req, res) => {
  const entryId = String(req.params.id);
  const entry = await prisma.diaryEntry.findFirst({
    where: { id: entryId, userId: req.user!.id }
  });

  if (!entry) {
    res.status(404).json({ message: "Diary entry not found." });
    return;
  }

  const reflection = await reflectOnDiaryEntry(entry.content, req.user!.name);
  const updated = await prisma.diaryEntry.update({
    where: { id: entry.id },
    data: { aiReflection: reflection }
  });

  res.json(updated);
});

router.post("/photos", upload.array("photos", 3), async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  res.json({
    photos: files.map((file) => `/uploads/${file.filename}`)
  });
});

export default router;
