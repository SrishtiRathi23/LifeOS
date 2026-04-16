import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { prisma } from "../utils/db.js";
import { sanitizePlainText } from "../utils/sanitize.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = Router();

const subjectSchema = z.object({
  name: z.string().min(1).max(120),
  credits: z.number().int().min(1).max(12),
  semester: z.string().min(1).max(40),
  attendedClasses: z.number().int().min(0).default(0),
  totalClasses: z.number().int().min(0).default(0),
  notesUrl: z.string().url().optional().nullable()
});

const assignmentSchema = z.object({
  subjectId: z.string(),
  title: z.string().min(1).max(160),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(["pending", "in_progress", "submitted", "graded"]).default("pending"),
  marks: z.number().min(0).optional().nullable()
});

const examSchema = z.object({
  subjectId: z.string(),
  date: z.string().datetime(),
  type: z.string().min(1).max(80),
  marks: z.number().min(0).optional().nullable(),
  totalMarks: z.number().min(0).optional().nullable()
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const [subjects, assignments, exams] = await Promise.all([
    prisma.subject.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" }
    }),
    prisma.assignment.findMany({
      where: { userId: req.user!.id },
      orderBy: { dueDate: "asc" }
    }),
    prisma.exam.findMany({
      where: { userId: req.user!.id },
      orderBy: { date: "asc" }
    })
  ]);

  res.json({ subjects, assignments, exams });
});

router.post("/subjects", validateBody(subjectSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof subjectSchema>;
  const subject = await prisma.subject.create({
    data: {
      userId: req.user!.id,
      name: sanitizePlainText(payload.name),
      credits: payload.credits,
      semester: sanitizePlainText(payload.semester),
      attendedClasses: payload.attendedClasses,
      totalClasses: payload.totalClasses,
      notesUrl: payload.notesUrl ?? null
    }
  });
  res.status(201).json(subject);
});

router.post("/assignments", validateBody(assignmentSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof assignmentSchema>;
  const subject = await prisma.subject.findFirst({ where: { id: payload.subjectId, userId: req.user!.id } });
  if (!subject) {
    throw new ApiError(404, "Subject not found.");
  }

  const assignment = await prisma.assignment.create({
    data: {
      userId: req.user!.id,
      subjectId: payload.subjectId,
      title: sanitizePlainText(payload.title),
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      status: payload.status,
      marks: payload.marks ?? null
    }
  });
  res.status(201).json(assignment);
});

router.post("/exams", validateBody(examSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof examSchema>;
  const subject = await prisma.subject.findFirst({ where: { id: payload.subjectId, userId: req.user!.id } });
  if (!subject) {
    throw new ApiError(404, "Subject not found.");
  }

  const exam = await prisma.exam.create({
    data: {
      userId: req.user!.id,
      subjectId: payload.subjectId,
      date: new Date(payload.date),
      type: sanitizePlainText(payload.type),
      marks: payload.marks ?? null,
      totalMarks: payload.totalMarks ?? null
    }
  });
  res.status(201).json(exam);
});

router.delete("/subjects/:id", async (req, res) => {
  const id = String(req.params.id);
  const deleted = await prisma.subject.deleteMany({ where: { id, userId: req.user!.id } });
  if (deleted.count === 0) throw new ApiError(404, "Subject not found.");
  res.status(204).send();
});

router.delete("/assignments/:id", async (req, res) => {
  const id = String(req.params.id);
  const deleted = await prisma.assignment.deleteMany({ where: { id, userId: req.user!.id } });
  if (deleted.count === 0) throw new ApiError(404, "Assignment not found.");
  res.status(204).send();
});

router.delete("/exams/:id", async (req, res) => {
  const id = String(req.params.id);
  const deleted = await prisma.exam.deleteMany({ where: { id, userId: req.user!.id } });
  if (deleted.count === 0) throw new ApiError(404, "Exam not found.");
  res.status(204).send();
});

export default router;
