import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { prisma } from "../utils/db.js";
import { sanitizePlainText } from "../utils/sanitize.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = Router();

const exerciseSchema = z.object({
  date: z.string().datetime(),
  type: z.enum(["walk", "gym", "yoga", "sports", "cycling", "home_workout", "other"]),
  duration: z.number().int().positive(),
  intensity: z.number().int().min(1).max(5),
  notes: z.string().max(500).optional().nullable()
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const logs = await prisma.exerciseLog.findMany({
    where: { userId: req.user!.id },
    orderBy: { date: "desc" }
  });
  res.json(logs);
});

router.post("/", validateBody(exerciseSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof exerciseSchema>;
  const log = await prisma.exerciseLog.create({
    data: {
      userId: req.user!.id,
      date: new Date(payload.date),
      type: payload.type,
      duration: payload.duration,
      intensity: payload.intensity,
      notes: payload.notes ? sanitizePlainText(payload.notes) : null
    }
  });
  res.status(201).json(log);
});

router.delete("/:id", async (req, res) => {
  const deleted = await prisma.exerciseLog.deleteMany({
    where: { id: String(req.params.id), userId: req.user!.id }
  });
  if (deleted.count === 0) {
    throw new ApiError(404, "Exercise log not found.");
  }
  res.status(204).send();
});

export default router;
