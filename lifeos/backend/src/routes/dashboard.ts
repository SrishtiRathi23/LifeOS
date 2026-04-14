import { Router } from "express";
import dayjs from "dayjs";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../utils/db.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const userId = req.user!.id;
  const todayStart = dayjs().startOf("day").toDate();
  const todayEnd = dayjs().endOf("day").toDate();
  const monthStart = dayjs().startOf("month").toDate();
  const monthEnd = dayjs().endOf("month").toDate();

  const [todayTasks, pendingAssignments, nextExam, thisMonthBudget, thisMonthExpenses, recentDiary, habits, latestHabitLogs, deadlines] =
    await Promise.all([
      prisma.task.count({ where: { userId, date: { gte: todayStart, lte: todayEnd }, status: { not: "done" } } }),
      prisma.assignment.count({ where: { userId, status: { not: "submitted" } } }),
      prisma.exam.findFirst({ where: { userId, date: { gte: todayStart } }, orderBy: { date: "asc" } }),
      prisma.budget.findFirst({
        where: { userId, month: dayjs().month() + 1, year: dayjs().year() }
      }),
      prisma.expense.aggregate({
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true }
      }),
      prisma.diaryEntry.findFirst({ where: { userId }, orderBy: { date: "desc" } }),
      prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, take: 7 }),
      prisma.habitLog.findMany({
        where: { userId, date: { gte: dayjs().subtract(6, "day").startOf("day").toDate() } }
      }),
      prisma.task.findMany({
        where: { userId, date: { gte: todayStart }, status: { not: "done" } },
        orderBy: { date: "asc" },
        take: 5
      })
    ]);

  const spent = Number(thisMonthExpenses._sum.amount ?? 0);
  const budget = Number(thisMonthBudget?.totalBudget ?? 0);
  const typedHabits = habits as Array<{ id: string } & Record<string, unknown>>;
  const typedHabitLogs = latestHabitLogs as Array<{ habitId: string } & Record<string, unknown>>;

  res.json({
    greetingName: req.user!.name,
    date: new Date(),
    stats: {
      tasksDueToday: todayTasks,
      pendingAssignments,
      daysToNextExam: nextExam ? dayjs(nextExam.date).diff(dayjs(), "day") : null,
      monthlyBudgetRemaining: budget > 0 ? budget - spent : null
    },
    recentDiary,
    deadlines,
    habits: typedHabits.map((habit) => ({
      ...habit,
      logs: typedHabitLogs.filter((log) => log.habitId === habit.id)
    }))
  });
});

export default router;
