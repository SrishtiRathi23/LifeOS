import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { prisma } from "../utils/db.js";
import { sanitizePlainText } from "../utils/sanitize.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = Router();

const hobbySchema = z.object({
  name: z.string().min(1).max(120),
  category: z.enum(["creative", "physical", "digital", "social", "other"]).default("other")
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const hobbies = await prisma.hobby.findMany({
    where: { userId: req.user!.id },
    include: { logs: { orderBy: { date: "desc" }, take: 30 } },
    orderBy: { createdAt: "desc" }
  });
  res.json(hobbies);
});

router.post("/", validateBody(hobbySchema), async (req, res) => {
  const payload = req.body as z.infer<typeof hobbySchema>;
  const hobby = await prisma.hobby.create({
    data: {
      userId: req.user!.id,
      name: sanitizePlainText(payload.name),
      category: payload.category
    }
  });
  res.status(201).json(hobby);
});

router.post("/log", validateBody(z.object({ hobbyId: z.string(), date: z.string().datetime(), duration: z.number().int().positive(), notes: z.string().max(500).optional().nullable() })), async (req, res) => {
  const payload = req.body as { hobbyId: string; date: string; duration: number; notes?: string | null };
  const hobby = await prisma.hobby.findFirst({ where: { id: payload.hobbyId, userId: req.user!.id } });
  if (!hobby) {
    throw new ApiError(404, "Hobby not found.");
  }

  const log = await prisma.hobbyLog.create({
    data: {
      hobbyId: payload.hobbyId,
      userId: req.user!.id,
      date: new Date(payload.date),
      duration: payload.duration,
      notes: payload.notes ? sanitizePlainText(payload.notes) : null
    }
  });
  res.status(201).json(log);
});

router.delete("/:id", async (req, res) => {
  const id = String(req.params.id);
  const deleted = await prisma.hobby.deleteMany({ where: { id, userId: req.user!.id } });
  if (deleted.count === 0) throw new ApiError(404, "Hobby not found.");
  res.status(204).send();
});

export default router;
