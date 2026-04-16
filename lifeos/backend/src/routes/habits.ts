import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { prisma } from "../utils/db.js";
import { sanitizePlainText } from "../utils/sanitize.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = Router();

const habitSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.enum(["study", "wellness", "fitness", "personal", "digital", "other"]).default("other"),
  targetDays: z.number().int().min(1).max(7).default(7)
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.user!.id },
    include: { logs: { orderBy: { date: "desc" }, take: 60 } },
    orderBy: { createdAt: "desc" }
  });
  res.json(habits);
});

router.post("/", validateBody(habitSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof habitSchema>;
  const habit = await prisma.habit.create({
    data: {
      userId: req.user!.id,
      name: sanitizePlainText(payload.name),
      category: payload.category,
      targetDays: payload.targetDays
    }
  });
  res.status(201).json(habit);
});

router.post("/log", validateBody(z.object({ habitId: z.string(), date: z.string().datetime(), completed: z.boolean().default(true) })), async (req, res) => {
  const payload = req.body as { habitId: string; date: string; completed: boolean };
  const habit = await prisma.habit.findFirst({ where: { id: payload.habitId, userId: req.user!.id } });
  if (!habit) {
    throw new ApiError(404, "Habit not found.");
  }

  const log = await prisma.habitLog.upsert({
    where: {
      habitId_date: {
        habitId: payload.habitId,
        date: new Date(payload.date)
      }
    },
    update: { completed: payload.completed },
    create: {
      habitId: payload.habitId,
      userId: req.user!.id,
      date: new Date(payload.date),
      completed: payload.completed
    }
  });

  res.status(201).json(log);
});

router.delete("/:id", async (req, res) => {
  const id = String(req.params.id);
  const deleted = await prisma.habit.deleteMany({ where: { id, userId: req.user!.id } });
  if (deleted.count === 0) throw new ApiError(404, "Habit not found.");
  res.status(204).send();
});

export default router;
