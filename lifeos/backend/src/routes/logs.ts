import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { prisma } from "../utils/db.js";
import { sanitizePlainText } from "../utils/sanitize.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/water",
  validateQuery(z.object({ date: z.string().datetime() })),
  async (req, res) => {
    const date = new Date(String(req.query.date));
    const water = await prisma.waterLog.findUnique({
      where: {
        userId_date: {
          userId: req.user!.id,
          date
        }
      }
    });

    res.json(water ?? { glasses: 0, date });
  }
);

router.post(
  "/water",
  validateBody(z.object({ date: z.string().datetime(), glasses: z.number().int().min(0).max(8) })),
  async (req, res) => {
    const payload = req.body as { date: string; glasses: number };
    const water = await prisma.waterLog.upsert({
      where: {
        userId_date: {
          userId: req.user!.id,
          date: new Date(payload.date)
        }
      },
      update: { glasses: payload.glasses },
      create: {
        userId: req.user!.id,
        date: new Date(payload.date),
        glasses: payload.glasses
      }
    });

    res.status(201).json(water);
  }
);

router.post(
  "/mood",
  validateBody(
    z.object({
      date: z.string().datetime(),
      mood: z.number().int().min(1).max(5),
      note: z.string().max(300).optional().nullable(),
      energyLevel: z.number().int().min(1).max(5).optional().nullable()
    })
  ),
  async (req, res) => {
    const payload = req.body as { date: string; mood: number; note?: string | null; energyLevel?: number | null };
    const log = await prisma.moodLog.upsert({
      where: {
        userId_date: {
          userId: req.user!.id,
          date: new Date(payload.date)
        }
      },
      update: {
        mood: payload.mood,
        note: payload.note ? sanitizePlainText(payload.note) : null,
        energyLevel: payload.energyLevel ?? null
      },
      create: {
        userId: req.user!.id,
        date: new Date(payload.date),
        mood: payload.mood,
        note: payload.note ? sanitizePlainText(payload.note) : null,
        energyLevel: payload.energyLevel ?? null
      }
    });

    res.status(201).json(log);
  }
);

export default router;
