import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { prisma } from "../utils/db.js";
import { sanitizePlainText } from "../utils/sanitize.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = Router();

const hackathonSchema = z.object({
  name: z.string().min(1).max(160),
  date: z.string().datetime().optional().nullable(),
  mode: z.string().max(40).optional().nullable(),
  teamSize: z.number().int().min(1).max(20).optional().nullable(),
  theme: z.string().max(120).optional().nullable(),
  status: z.enum(["planning", "registered", "building", "submitted", "results"]).default("planning"),
  idea: z.string().max(2000).optional().nullable(),
  techStack: z.string().max(500).optional().nullable(),
  result: z.string().max(200).optional().nullable(),
  projectLink: z.string().url().optional().nullable()
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const items = await prisma.hackathon.findMany({
    where: { userId: req.user!.id },
    orderBy: { date: "asc" }
  });
  res.json(items);
});

router.post("/", validateBody(hackathonSchema), async (req, res) => {
  const payload = req.body as z.infer<typeof hackathonSchema>;
  const item = await prisma.hackathon.create({
    data: {
      userId: req.user!.id,
      name: sanitizePlainText(payload.name),
      date: payload.date ? new Date(payload.date) : null,
      mode: payload.mode ? sanitizePlainText(payload.mode) : null,
      teamSize: payload.teamSize ?? null,
      theme: payload.theme ? sanitizePlainText(payload.theme) : null,
      status: payload.status,
      idea: payload.idea ? sanitizePlainText(payload.idea) : null,
      techStack: payload.techStack ? sanitizePlainText(payload.techStack) : null,
      result: payload.result ? sanitizePlainText(payload.result) : null,
      projectLink: payload.projectLink ?? null
    }
  });
  res.status(201).json(item);
});

router.patch("/:id", validateBody(hackathonSchema.partial()), async (req, res) => {
  const id = String(req.params.id);
  const existing = await prisma.hackathon.findFirst({ where: { id, userId: req.user!.id } });
  if (!existing) {
    throw new ApiError(404, "Hackathon not found.");
  }

  const payload = req.body as Partial<z.infer<typeof hackathonSchema>>;
  const item = await prisma.hackathon.update({
    where: { id },
    data: {
      name: payload.name ? sanitizePlainText(payload.name) : undefined,
      date: payload.date ? new Date(payload.date) : payload.date,
      mode: payload.mode ? sanitizePlainText(payload.mode) : payload.mode,
      teamSize: payload.teamSize,
      theme: payload.theme ? sanitizePlainText(payload.theme) : payload.theme,
      status: payload.status,
      idea: payload.idea ? sanitizePlainText(payload.idea) : payload.idea,
      techStack: payload.techStack ? sanitizePlainText(payload.techStack) : payload.techStack,
      result: payload.result ? sanitizePlainText(payload.result) : payload.result,
      projectLink: payload.projectLink
    }
  });
  res.json(item);
});

export default router;
