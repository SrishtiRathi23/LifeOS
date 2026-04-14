import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { prisma } from "../utils/db.js";
import { sanitizePlainText } from "../utils/sanitize.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = Router();

const internshipSchema = z.object({
  company: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  status: z.enum(["shortlisted", "applied", "interviewing", "offer", "rejected"]).default("applied"),
  appliedDate: z.string().datetime().optional().nullable(),
  stipend: z.string().max(80).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  link: z.string().url().optional().nullable(),
  contactPerson: z.string().max(120).optional().nullable(),
  resumeSent: z.boolean().default(false),
  coverLetterUsed: z.boolean().default(false)
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const items = await prisma.internship.findMany({
    where: { userId: req.user!.id },
    orderBy: { updatedAt: "desc" }
  });
  res.json(items);
});

router.post("/", validateBody(internshipSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof internshipSchema>;
  const item = await prisma.internship.create({
    data: {
      userId: req.user!.id,
      company: sanitizePlainText(payload.company),
      role: sanitizePlainText(payload.role),
      status: payload.status,
      appliedDate: payload.appliedDate ? new Date(payload.appliedDate) : null,
      stipend: payload.stipend ? sanitizePlainText(payload.stipend) : null,
      location: payload.location ? sanitizePlainText(payload.location) : null,
      notes: payload.notes ? sanitizePlainText(payload.notes) : null,
      link: payload.link ?? null,
      contactPerson: payload.contactPerson ? sanitizePlainText(payload.contactPerson) : null,
      resumeSent: payload.resumeSent,
      coverLetterUsed: payload.coverLetterUsed
    }
  });
  res.status(201).json(item);
});

router.patch("/:id", validateBody(internshipSchema.partial()), async (req, res) => {
  const id = String(req.params.id);
  const existing = await prisma.internship.findFirst({ where: { id, userId: req.user!.id } });
  if (!existing) {
    throw new ApiError(404, "Internship application not found.");
  }

  const payload = req.body as Partial<z.infer<typeof internshipSchema>>;
  const item = await prisma.internship.update({
    where: { id },
    data: {
      company: payload.company ? sanitizePlainText(payload.company) : undefined,
      role: payload.role ? sanitizePlainText(payload.role) : undefined,
      status: payload.status,
      appliedDate: payload.appliedDate ? new Date(payload.appliedDate) : payload.appliedDate,
      stipend: payload.stipend ? sanitizePlainText(payload.stipend) : payload.stipend,
      location: payload.location ? sanitizePlainText(payload.location) : payload.location,
      notes: payload.notes ? sanitizePlainText(payload.notes) : payload.notes,
      link: payload.link,
      contactPerson: payload.contactPerson ? sanitizePlainText(payload.contactPerson) : payload.contactPerson,
      resumeSent: payload.resumeSent,
      coverLetterUsed: payload.coverLetterUsed
    }
  });
  res.json(item);
});

export default router;
