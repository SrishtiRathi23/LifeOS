import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { prisma } from "../utils/db.js";
import { sanitizePlainText } from "../utils/sanitize.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = Router();

const resourceSchema = z.object({
  title: z.string().min(1).max(160),
  platform: z.string().max(120).optional().nullable(),
  category: z.enum(["web_dev", "dsa", "cloud", "ai_ml", "eee_core", "gate_prep", "aptitude", "soft_skills", "other"]).default("other"),
  progress: z.number().int().min(0).max(100).default(0),
  startDate: z.string().datetime().optional().nullable(),
  targetDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  link: z.string().url().optional().nullable(),
  certificateUrl: z.string().url().optional().nullable()
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const resources = await prisma.learningResource.findMany({
    where: { userId: req.user!.id },
    include: { studyLogs: { orderBy: { date: "desc" }, take: 30 } },
    orderBy: { createdAt: "desc" }
  });
  res.json(resources);
});

router.post("/", validateBody(resourceSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof resourceSchema>;
  const resource = await prisma.learningResource.create({
    data: {
      userId: req.user!.id,
      title: sanitizePlainText(payload.title),
      platform: payload.platform ? sanitizePlainText(payload.platform) : null,
      category: payload.category,
      progress: payload.progress,
      startDate: payload.startDate ? new Date(payload.startDate) : null,
      targetDate: payload.targetDate ? new Date(payload.targetDate) : null,
      notes: payload.notes ? sanitizePlainText(payload.notes) : null,
      link: payload.link ?? null,
      certificateUrl: payload.certificateUrl ?? null
    }
  });
  res.status(201).json(resource);
});

router.post("/:id/study-log", validateBody(z.object({ date: z.string().datetime(), hours: z.number().positive() })), async (req, res) => {
  const resourceId = String(req.params.id);
  const resource = await prisma.learningResource.findFirst({ where: { id: resourceId, userId: req.user!.id } });
  if (!resource) {
    throw new ApiError(404, "Learning resource not found.");
  }

  const log = await prisma.studyLog.create({
    data: {
      userId: req.user!.id,
      resourceId,
      date: new Date(req.body.date),
      hours: req.body.hours
    }
  });

  res.status(201).json(log);
});

export default router;
