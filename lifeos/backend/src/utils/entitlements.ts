import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export const premiumFeatureKeys = [
  "vision-board",
  "expenses",
  "college",
  "internships",
  "hackathons",
  "exercise",
  "learning",
  "hobbies",
  "advanced-reminders",
  "data-export",
  "ai-reflections"
] as const;

export type PremiumFeatureKey = (typeof premiumFeatureKeys)[number];

export function hasPremiumAccess(user: {
  plan: SubscriptionPlan;
  planStatus: SubscriptionStatus;
  premiumUntil: Date | null;
}) {
  if (user.plan !== "premium") return false;
  if (!["active", "trialing"].includes(user.planStatus)) return false;
  if (!user.premiumUntil) return true;

  return user.premiumUntil.getTime() > Date.now();
}

export function buildEntitlements(user: {
  plan: SubscriptionPlan;
  planStatus: SubscriptionStatus;
  premiumUntil: Date | null;
}) {
  const isPremium = hasPremiumAccess(user);

  return {
    plan: user.plan,
    status: user.planStatus,
    premiumUntil: user.premiumUntil,
    isPremium,
    premiumFeatures: premiumFeatureKeys.reduce<Record<PremiumFeatureKey, boolean>>((features, key) => {
      features[key] = isPremium;
      return features;
    }, {} as Record<PremiumFeatureKey, boolean>)
  };
}
