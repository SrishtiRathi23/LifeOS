-- Production readiness: subscriptions and reminder notifications
CREATE TYPE "SubscriptionPlan" AS ENUM ('free', 'premium');
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'trialing', 'past_due', 'canceled');
CREATE TYPE "ReminderSource" AS ENUM ('task', 'assignment', 'exam', 'internship', 'hackathon', 'learning', 'goal');

ALTER TABLE "User" ADD COLUMN "plan" "SubscriptionPlan" NOT NULL DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN "planStatus" "SubscriptionStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "User" ADD COLUMN "premiumUntil" TIMESTAMP(3);

CREATE TABLE "ReminderPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "dailyDigestTime" TEXT NOT NULL DEFAULT '08:00',
    "remindBeforeDays" INTEGER[] DEFAULT ARRAY[7, 3, 1]::INTEGER[],
    "includeTasks" BOOLEAN NOT NULL DEFAULT true,
    "includeCollege" BOOLEAN NOT NULL DEFAULT true,
    "includeCareer" BOOLEAN NOT NULL DEFAULT true,
    "includeLearning" BOOLEAN NOT NULL DEFAULT true,
    "includeGoals" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReminderPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReminderEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "ReminderSource" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReminderEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReminderPreference_userId_key" ON "ReminderPreference"("userId");
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");
CREATE UNIQUE INDEX "ReminderEvent_userId_source_sourceId_remindAt_key" ON "ReminderEvent"("userId", "source", "sourceId", "remindAt");
CREATE INDEX "ReminderEvent_userId_remindAt_idx" ON "ReminderEvent"("userId", "remindAt");
CREATE INDEX "ReminderEvent_deliveredAt_remindAt_idx" ON "ReminderEvent"("deliveredAt", "remindAt");

ALTER TABLE "ReminderPreference" ADD CONSTRAINT "ReminderPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReminderEvent" ADD CONSTRAINT "ReminderEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
