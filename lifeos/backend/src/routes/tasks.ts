import fs from "node:fs/promises";
import { Router } from "express";
import dayjs from "dayjs";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { prisma } from "../utils/db.js";
import { parseNotebookImage } from "../utils/claudeClient.js";
import { sanitizePlainText } from "../utils/sanitize.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = Router();

const taskSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(5000).optional().nullable(),
  date: z.string().datetime().optional().nullable(),
  dueTime: z.string().max(40).optional().nullable(),
  category: z.enum(["college", "personal", "learning", "health", "finance", "career", "hobby", "other"]).default("other"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  status: z.enum(["todo", "in_progress", "done", "archived"]).default("todo"),
  isRecurring: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
  source: z.string().max(80).optional().nullable()
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.user!.id },
    orderBy: [{ date: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }]
  });
  res.json(tasks);
});

router.get("/today", async (req, res) => {
  const start = dayjs().startOf("day").toDate();
  const end = dayjs().endOf("day").toDate();

  const tasks = await prisma.task.findMany({
    where: { userId: req.user!.id, date: { gte: start, lte: end } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });

  res.json(tasks);
});

router.get("/week", validateQuery(z.object({ start: z.string().datetime().optional() })), async (req, res) => {
  const start = req.query.start ? dayjs(String(req.query.start)) : dayjs().startOf("week");
  const end = start.endOf("week");

  const tasks = await prisma.task.findMany({
    where: { userId: req.user!.id, date: { gte: start.toDate(), lte: end.toDate() } },
    orderBy: [{ date: "asc" }, { sortOrder: "asc" }]
  });

  res.json(tasks);
});

router.post("/", validateBody(taskSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof taskSchema>;
  const task = await prisma.task.create({
    data: {
      ...payload,
      title: sanitizePlainText(payload.title),
      description: payload.description ? sanitizePlainText(payload.description) : null,
      date: payload.date ? new Date(payload.date) : null,
      userId: req.user!.id
    }
  });

  res.status(201).json(task);
});

router.patch("/:id", validateBody(taskSchema.partial()), async (req, res) => {
  const taskId = String(req.params.id);
  const payload = req.body as Partial<z.infer<typeof taskSchema>>;
  const existingTask = await prisma.task.findFirst({
    where: { id: taskId, userId: req.user!.id }
  });

  if (!existingTask) {
    throw new ApiError(404, "Task not found.");
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...payload,
      title: payload.title ? sanitizePlainText(payload.title) : undefined,
      description: payload.description ? sanitizePlainText(payload.description) : payload.description,
      date: payload.date ? new Date(payload.date) : payload.date
    }
  });

  res.json(task);
});

router.delete("/:id", async (req, res) => {
  const taskId = String(req.params.id);
  const deleted = await prisma.task.deleteMany({
    where: { id: taskId, userId: req.user!.id }
  });

  if (deleted.count === 0) {
    throw new ApiError(404, "Task not found.");
  }

  res.status(204).send();
});



export default router;
