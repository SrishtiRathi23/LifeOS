import { Router } from "express";
import dayjs from "dayjs";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { prisma } from "../utils/db.js";
import { sanitizePlainText } from "../utils/sanitize.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = Router();

const expenseSchema = z.object({
  amount: z.number().positive(),
  category: z.enum(["food", "transport", "college_fees", "books", "entertainment", "health", "savings", "misc"]),
  date: z.string().datetime(),
  note: z.string().max(500).optional().nullable(),
  paymentMethod: z.string().max(80).optional().nullable(),
  isRecurring: z.boolean().default(false)
});

const budgetSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  totalBudget: z.number().nonnegative(),
  savingsGoal: z.number().nonnegative().optional().nullable()
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const expenses = await prisma.expense.findMany({
    where: { userId: req.user!.id },
    orderBy: { date: "desc" }
  });
  res.json(expenses);
});

router.get("/summary", validateQuery(z.object({ month: z.coerce.number().optional(), year: z.coerce.number().optional() })), async (req, res) => {
  const month = Number(req.query.month ?? dayjs().month() + 1);
  const year = Number(req.query.year ?? dayjs().year());
  const start = dayjs().year(year).month(month - 1).startOf("month").toDate();
  const end = dayjs().year(year).month(month - 1).endOf("month").toDate();

  const [expenses, budget] = await Promise.all([
    prisma.expense.findMany({
      where: { userId: req.user!.id, date: { gte: start, lte: end } },
      orderBy: { date: "asc" }
    }),
    prisma.budget.findUnique({
      where: {
        userId_month_year: {
          userId: req.user!.id,
          month,
          year
        }
      }
    })
  ]);

  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const byCategory = expenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] ?? 0) + Number(expense.amount);
    return acc;
  }, {});

  res.json({
    totalSpent,
    remaining: budget ? Number(budget.totalBudget) - totalSpent : null,
    savingsGoal: budget ? Number(budget.savingsGoal ?? 0) : null,
    budget: budget ? Number(budget.totalBudget) : null,
    byCategory,
    daily: expenses.map((expense) => ({
      date: expense.date,
      amount: Number(expense.amount),
      category: expense.category
    }))
  });
});

router.post("/", validateBody(expenseSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof expenseSchema>;
  const expense = await prisma.expense.create({
    data: {
      userId: req.user!.id,
      amount: payload.amount,
      category: payload.category,
      date: new Date(payload.date),
      note: payload.note ? sanitizePlainText(payload.note) : null,
      paymentMethod: payload.paymentMethod ? sanitizePlainText(payload.paymentMethod) : null,
      isRecurring: payload.isRecurring
    }
  });

  res.status(201).json(expense);
});

router.delete("/:id", async (req, res) => {
  const deleted = await prisma.expense.deleteMany({
    where: { id: String(req.params.id), userId: req.user!.id }
  });

  if (deleted.count === 0) {
    throw new ApiError(404, "Expense not found.");
  }

  res.status(204).send();
});

router.get("/budget", validateQuery(z.object({ month: z.coerce.number().optional(), year: z.coerce.number().optional() })), async (req, res) => {
  const month = Number(req.query.month ?? dayjs().month() + 1);
  const year = Number(req.query.year ?? dayjs().year());
  const budget = await prisma.budget.findUnique({
    where: {
      userId_month_year: {
        userId: req.user!.id,
        month,
        year
      }
    }
  });
  res.json(budget);
});

router.post("/budget", validateBody(budgetSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof budgetSchema>;
  const budget = await prisma.budget.upsert({
    where: {
      userId_month_year: {
        userId: req.user!.id,
        month: payload.month,
        year: payload.year
      }
    },
    update: {
      totalBudget: payload.totalBudget,
      savingsGoal: payload.savingsGoal ?? null
    },
    create: {
      userId: req.user!.id,
      month: payload.month,
      year: payload.year,
      totalBudget: payload.totalBudget,
      savingsGoal: payload.savingsGoal ?? null
    }
  });

  res.status(201).json(budget);
});

export default router;
