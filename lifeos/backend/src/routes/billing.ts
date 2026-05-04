import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../utils/db.js";
import { buildEntitlements } from "../utils/entitlements.js";

const router = Router();

router.use(requireAuth);

router.get("/me", async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
    select: { plan: true, planStatus: true, premiumUntil: true }
  });

  res.json(buildEntitlements(user));
});

export default router;
