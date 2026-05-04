import { Router } from "express";
import dayjs from "dayjs";
import { z } from "zod";
import { ReminderSource } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { prisma } from "../utils/db.js";
import { sanitizePlainText } from "../utils/sanitize.js";
import { buildEntitlements } from "../utils/entitlements.js";

const router = Router();

const preferenceSchema = z.object({
  enabled: z.boolean().optional(),
  dailyDigestTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  remindBeforeDays: z.array(z.number().int().min(0).max(30)).min(1).max(5).optional(),
  includeTasks: z.boolean().optional(),
  includeCollege: z.boolean().optional(),
  includeCareer: z.boolean().optional(),
  includeLearning: z.boolean().optional(),
  includeGoals: z.boolean().optional()
});

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.record(z.string())
});

type Candidate = {
  source: ReminderSource;
  sourceId: string;
  title: string;
  dueAt: Date;
  group: "tasks" | "college" | "career" | "learning" | "goals";
};

const defaultPreference = {
  enabled: true,
  dailyDigestTime: "08:00",
  remindBeforeDays: [7, 3, 1],
  includeTasks: true,
  includeCollege: true,
  includeCareer: true,
  includeLearning: true,
  includeGoals: true
};

router.use(requireAuth);

async function getReminderCandidates(userId: string, horizonDays: number): Promise<Candidate[]> {
  const now = dayjs().startOf("day");
  const horizon = dayjs().add(horizonDays, "day").endOf("day").toDate();

  const [tasks, assignments, exams, internships, hackathons, learning, goals] = await Promise.all([
    prisma.task.findMany({
      where: { userId, date: { gte: now.toDate(), lte: horizon }, status: { not: "done" } },
      select: { id: true, title: true, date: true }
    }),
    prisma.assignment.findMany({
      where: { userId, dueDate: { gte: now.toDate(), lte: horizon }, status: { notIn: ["submitted", "graded"] } },
      select: { id: true, title: true, dueDate: true }
    }),
    prisma.exam.findMany({
      where: { userId, date: { gte: now.toDate(), lte: horizon } },
      select: { id: true, type: true, date: true, subject: { select: { name: true } } }
    }),
    prisma.internship.findMany({
      where: { userId, deadline: { gte: now.toDate(), lte: horizon } },
      select: { id: true, company: true, role: true, deadline: true }
    }),
    prisma.hackathon.findMany({
      where: { userId, date: { gte: now.toDate(), lte: horizon } },
      select: { id: true, name: true, date: true }
    }),
    prisma.learningResource.findMany({
      where: { userId, targetDate: { gte: now.toDate(), lte: horizon }, progress: { lt: 100 } },
      select: { id: true, title: true, targetDate: true }
    }),
    prisma.goal.findMany({
      where: { userId, targetDate: { gte: now.toDate(), lte: horizon }, status: "active" },
      select: { id: true, title: true, targetDate: true }
    })
  ]);

  return [
    ...tasks.filter((item) => item.date).map((item) => ({
      source: ReminderSource.task,
      sourceId: item.id,
      title: item.title,
      dueAt: item.date!,
      group: "tasks" as const
    })),
    ...assignments.filter((item) => item.dueDate).map((item) => ({
      source: ReminderSource.assignment,
      sourceId: item.id,
      title: item.title,
      dueAt: item.dueDate!,
      group: "college" as const
    })),
    ...exams.map((item) => ({
      source: ReminderSource.exam,
      sourceId: item.id,
      title: `${item.subject.name} ${item.type}`,
      dueAt: item.date,
      group: "college" as const
    })),
    ...internships.filter((item) => item.deadline).map((item) => ({
      source: ReminderSource.internship,
      sourceId: item.id,
      title: `${item.company} - ${item.role}`,
      dueAt: item.deadline!,
      group: "career" as const
    })),
    ...hackathons.filter((item) => item.date).map((item) => ({
      source: ReminderSource.hackathon,
      sourceId: item.id,
      title: item.name,
      dueAt: item.date!,
      group: "career" as const
    })),
    ...learning.filter((item) => item.targetDate).map((item) => ({
      source: ReminderSource.learning,
      sourceId: item.id,
      title: item.title,
      dueAt: item.targetDate!,
      group: "learning" as const
    })),
    ...goals.filter((item) => item.targetDate).map((item) => ({
      source: ReminderSource.goal,
      sourceId: item.id,
      title: item.title,
      dueAt: item.targetDate!,
      group: "goals" as const
    }))
  ];
}

function isIncluded(candidate: Candidate, preference: typeof defaultPreference) {
  return (
    (candidate.group === "tasks" && preference.includeTasks) ||
    (candidate.group === "college" && preference.includeCollege) ||
    (candidate.group === "career" && preference.includeCareer) ||
    (candidate.group === "learning" && preference.includeLearning) ||
    (candidate.group === "goals" && preference.includeGoals)
  );
}

async function getPreference(userId: string) {
  const existing = await prisma.reminderPreference.findUnique({ where: { userId } });
  return existing ?? prisma.reminderPreference.create({ data: { userId, ...defaultPreference } });
}

async function syncReminderEvents(userId: string) {
  const [preference, user] = await Promise.all([
    getPreference(userId),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { plan: true, planStatus: true, premiumUntil: true } })
  ]);
  const entitlements = buildEntitlements(user);
  const freeDays = [1];
  const remindBeforeDays = entitlements.isPremium ? preference.remindBeforeDays : freeDays;
  const horizonDays = Math.max(...remindBeforeDays, 1) + 30;
  const candidates = await getReminderCandidates(userId, horizonDays);
  const allowedCandidates = candidates.filter((candidate) => isIncluded(candidate, preference));

  if (!preference.enabled) {
    return { preference, reminders: [] };
  }

  await Promise.all(
    allowedCandidates.flatMap((candidate) =>
      remindBeforeDays.map((days) => {
        const remindAt = dayjs(candidate.dueAt)
          .subtract(days, "day")
          .hour(Number(preference.dailyDigestTime.slice(0, 2)))
          .minute(Number(preference.dailyDigestTime.slice(3, 5)))
          .second(0)
          .millisecond(0)
          .toDate();

        return prisma.reminderEvent.upsert({
          where: {
            userId_source_sourceId_remindAt: {
              userId,
              source: candidate.source,
              sourceId: candidate.sourceId,
              remindAt
            }
          },
          create: {
            userId,
            source: candidate.source,
            sourceId: candidate.sourceId,
            title: sanitizePlainText(candidate.title),
            dueAt: candidate.dueAt,
            remindAt
          },
          update: {
            title: sanitizePlainText(candidate.title),
            dueAt: candidate.dueAt,
            dismissedAt: null
          }
        });
      })
    )
  );

  const reminders = await prisma.reminderEvent.findMany({
    where: {
      userId,
      dismissedAt: null,
      dueAt: { gte: dayjs().startOf("day").toDate() },
      remindAt: { lte: dayjs().add(30, "day").endOf("day").toDate() }
    },
    orderBy: [{ dueAt: "asc" }, { remindAt: "asc" }],
    take: 40
  });

  return { preference, reminders };
}

router.get("/", async (req, res) => {
  res.json(await syncReminderEvents(req.user!.id));
});

router.patch("/preferences", validateBody(preferenceSchema), async (req, res) => {
  const existing = await getPreference(req.user!.id);
  const preference = await prisma.reminderPreference.update({
    where: { id: existing.id },
    data: req.body
  });

  res.json({ preference });
});

router.post("/push-subscriptions", validateBody(pushSubscriptionSchema), async (req, res) => {
  const subscription = await prisma.pushSubscription.upsert({
    where: { endpoint: req.body.endpoint },
    create: {
      userId: req.user!.id,
      endpoint: req.body.endpoint,
      keys: req.body.keys,
      userAgent: req.get("user-agent")
    },
    update: {
      userId: req.user!.id,
      keys: req.body.keys,
      userAgent: req.get("user-agent")
    }
  });

  res.status(201).json(subscription);
});

router.post("/:id/dismiss", async (req, res) => {
  const updated = await prisma.reminderEvent.updateMany({
    where: { id: String(req.params.id), userId: req.user!.id },
    data: { dismissedAt: new Date() }
  });

  res.status(updated.count ? 204 : 404).send();
});

export default router;
