import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { prisma } from "../utils/db.js";
import { sanitizePlainText } from "../utils/sanitize.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = Router();

const goalSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(4000).optional().nullable(),
  timeframe: z.enum(["week", "month", "year", "life"]),
  targetDate: z.string().datetime().optional().nullable(),
  progress: z.number().int().min(0).max(100).default(0),
  category: z.string().max(80).optional().nullable(),
  why: z.string().max(2000).optional().nullable(),
  status: z.enum(["active", "completed", "paused"]).default("active"),
  milestones: z.array(z.object({ label: z.string().max(160), completed: z.boolean().default(false) })).max(10).default([])
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const goals = await prisma.goal.findMany({
    where: { userId: req.user!.id },
    include: { history: { orderBy: { createdAt: "asc" } } },
    orderBy: [{ timeframe: "asc" }, { createdAt: "desc" }]
  });

  res.json(goals);
});

router.post("/", validateBody(goalSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof goalSchema>;
  const goal = await prisma.goal.create({
    data: {
      userId: req.user!.id,
      title: sanitizePlainText(payload.title),
      description: payload.description ? sanitizePlainText(payload.description) : null,
      timeframe: payload.timeframe,
      targetDate: payload.targetDate ? new Date(payload.targetDate) : null,
      progress: payload.progress,
      category: payload.category ? sanitizePlainText(payload.category) : null,
      why: payload.why ? sanitizePlainText(payload.why) : null,
      status: payload.status,
      milestones: payload.milestones
    }
  });

  await prisma.goalSnapshot.create({
    data: {
      goalId: goal.id,
      userId: req.user!.id,
      progress: goal.progress
    }
  });

  res.status(201).json(goal);
});

router.patch("/:id", validateBody(goalSchema.partial()), async (req, res) => {
  const goalId = String(req.params.id);
  const payload = req.body as Partial<z.infer<typeof goalSchema>>;
  const existingGoal = await prisma.goal.findFirst({ where: { id: goalId, userId: req.user!.id } });

  if (!existingGoal) {
    throw new ApiError(404, "Goal not found.");
  }

  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: {
      title: payload.title ? sanitizePlainText(payload.title) : undefined,
      description: payload.description ? sanitizePlainText(payload.description) : payload.description,
      timeframe: payload.timeframe,
      targetDate: payload.targetDate ? new Date(payload.targetDate) : payload.targetDate,
      progress: payload.progress,
      category: payload.category ? sanitizePlainText(payload.category) : payload.category,
      why: payload.why ? sanitizePlainText(payload.why) : payload.why,
      status: payload.status,
      milestones: payload.milestones ?? undefined
    }
  });

  if (typeof payload.progress === "number" && payload.progress !== existingGoal.progress) {
    await prisma.goalSnapshot.create({
      data: {
        goalId,
        userId: req.user!.id,
        progress: payload.progress
      }
    });
  }

  res.json(goal);
});

router.patch("/:id/progress", validateBody(z.object({ progress: z.number().int().min(0).max(100) })), async (req, res) => {
  const goalId = String(req.params.id);
  const existingGoal = await prisma.goal.findFirst({ where: { id: goalId, userId: req.user!.id } });

  if (!existingGoal) {
    throw new ApiError(404, "Goal not found.");
  }

  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: { progress: req.body.progress }
  });

  await prisma.goalSnapshot.create({
    data: {
      goalId,
      userId: req.user!.id,
      progress: req.body.progress
    }
  });

  res.json(goal);
});

router.delete("/:id", async (req, res) => {
  const deleted = await prisma.goal.deleteMany({
    where: { id: String(req.params.id), userId: req.user!.id }
  });

  if (deleted.count === 0) {
    throw new ApiError(404, "Goal not found.");
  }

  res.status(204).send();
});

export default router;
