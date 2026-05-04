import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { prisma } from "../utils/db.js";
import { sanitizePlainText } from "../utils/sanitize.js";
import { buildEntitlements, hasPremiumAccess } from "../utils/entitlements.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = Router();

const settingsSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  college: z.string().max(120).optional().nullable(),
  year: z.string().max(40).optional().nullable(),
  branch: z.string().max(80).optional().nullable(),
  theme: z.string().max(40).optional(),
  fontSize: z.enum(["small", "medium", "large"]).optional(),
  firstDayOfWeek: z.enum(["monday", "sunday"]).optional(),
  currency: z.string().max(10).optional(),
  sidebarCollapsed: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
  anthropicApiKey: z.string().optional().nullable()
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, profilePhoto: true, settings: true, plan: true, planStatus: true, premiumUntil: true }
  });

  res.json(user ? { ...user, entitlements: buildEntitlements(user) } : null);
});

router.patch("/", validateBody(settingsSchema), async (req, res) => {
  const currentUser = await prisma.user.findUnique({ where: { id: req.user!.id } });
  const currentSettings = (currentUser?.settings as Record<string, unknown> | null) ?? {};

  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      name: req.body.name ? sanitizePlainText(req.body.name) : undefined,
      settings: {
        ...currentSettings,
        ...req.body,
        anthropicApiKey: undefined
      }
    },
    select: { id: true, name: true, email: true, profilePhoto: true, settings: true, plan: true, planStatus: true, premiumUntil: true }
  });

  res.json({ ...updated, entitlements: buildEntitlements(updated) });
});

router.get("/export", async (req, res) => {
  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
    select: { plan: true, planStatus: true, premiumUntil: true }
  });

  if (!hasPremiumAccess(currentUser)) {
    throw new ApiError(402, "Full data export is a LifeOS Premium feature.");
  }

  const payload = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      tasks: true,
      dailyPlans: true,
      diaryEntries: true,
      goals: true,
      visionImages: true,
      expenses: true,
      budgets: true,
      subjects: true,
      assignments: true,
      exams: true,
      internships: true,
      hackathons: true,
      habits: true,
      habitLogs: true,
      exerciseLogs: true,
      learning: true,
      studyLogs: true,
      hobbies: true,
      hobbyLogs: true,
      moodLogs: true,
      sleepLogs: true,
      waterLogs: true
    }
  });

  res.json(payload);
});

export default router;
