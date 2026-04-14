import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { prisma } from "../utils/db.js";
import { sanitizePlainText } from "../utils/sanitize.js";

const router = Router();

const dailyPlanSchema = z.object({
  date: z.string().datetime(),
  brainDump: z.string().max(8000).optional().nullable(),
  goals: z.array(z.string().max(160)).max(3).optional().default([]),
  notes: z.string().max(8000).optional().nullable(),
  mood: z.number().int().min(1).max(5).optional().nullable(),
  priorityMatrix: z
    .object({
      urgentImportant: z.array(z.string()).default([]),
      importantNotUrgent: z.array(z.string()).default([]),
      urgentNotImportant: z.array(z.string()).default([]),
      neither: z.array(z.string()).default([])
    })
    .optional()
    .nullable(),
  eveningReview: z
    .object({
      accomplished: z.string().optional().default(""),
      unfinished: z.array(z.string()).optional().default([]),
      gratefulFor: z.string().optional().default(""),
      carryForward: z.array(z.string()).optional().default([])
    })
    .optional()
    .nullable(),
  timeBlocks: z.array(z.object({ hour: z.number().int().min(6).max(23), text: z.string().max(240).default("") })).optional().default([])
});

router.use(requireAuth);

router.get("/", validateQuery(z.object({ date: z.string().datetime() })), async (req, res) => {
  const date = new Date(String(req.query.date));

  const [plan, water] = await Promise.all([
    prisma.dailyPlan.findUnique({
      where: {
        userId_date: {
          userId: req.user!.id,
          date
        }
      }
    }),
    prisma.waterLog.findUnique({
      where: {
        userId_date: {
          userId: req.user!.id,
          date
        }
      }
    })
  ]);

  res.json({
    plan,
    waterGlasses: water?.glasses ?? 0
  });
});

router.post("/", validateBody(dailyPlanSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof dailyPlanSchema>;
  const date = new Date(payload.date);

  const plan = await prisma.dailyPlan.upsert({
    where: {
      userId_date: {
        userId: req.user!.id,
        date
      }
    },
    update: {
      brainDump: payload.brainDump ? sanitizePlainText(payload.brainDump) : null,
      goals: payload.goals.map(sanitizePlainText),
      notes: payload.notes ? sanitizePlainText(payload.notes) : null,
      mood: payload.mood,
      priorityMatrix: payload.priorityMatrix ?? undefined,
      eveningReview: payload.eveningReview ?? undefined,
      timeBlocks: payload.timeBlocks
    },
    create: {
      userId: req.user!.id,
      date,
      brainDump: payload.brainDump ? sanitizePlainText(payload.brainDump) : null,
      goals: payload.goals.map(sanitizePlainText),
      notes: payload.notes ? sanitizePlainText(payload.notes) : null,
      mood: payload.mood,
      priorityMatrix: payload.priorityMatrix ?? undefined,
      eveningReview: payload.eveningReview ?? undefined,
      timeBlocks: payload.timeBlocks
    }
  });

  res.status(201).json(plan);
});

export default router;
