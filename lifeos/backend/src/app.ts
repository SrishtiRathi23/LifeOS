import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { env } from "./utils/env.js";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import taskRoutes from "./routes/tasks.js";
import diaryRoutes from "./routes/diary.js";
import visionRoutes from "./routes/vision.js";
import dailyPlanRoutes from "./routes/dailyPlans.js";
import logRoutes from "./routes/logs.js";
import goalRoutes from "./routes/goals.js";
import expenseRoutes from "./routes/expenses.js";
import habitRoutes from "./routes/habits.js";
import exerciseRoutes from "./routes/exercise.js";
import learningRoutes from "./routes/learning.js";
import hobbyRoutes from "./routes/hobbies.js";
import collegeRoutes from "./routes/college.js";
import internshipRoutes from "./routes/internships.js";
import hackathonRoutes from "./routes/hackathons.js";
import settingsRoutes from "./routes/settings.js";
import "express-async-errors";
import * as Sentry from "@sentry/node";
import pinoHttp from "pino-http";
import compression from "compression";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { generalLimiter, authLimiter, aiLimiter } from "./middleware/rateLimit.js";

export const app = express();

app.use(compression());
app.use(pinoHttp({ logger }));

app.use(
  cors({
    origin: env.NODE_ENV === "production" ? env.CLIENT_URL : ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
      },
    },
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api", generalLimiter);
// Cloud storage is now used for all uploads

app.get("/api/v1/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/tasks/parse-image", aiLimiter);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/diary", diaryRoutes);
app.use("/api/v1/vision", visionRoutes);
app.use("/api/v1/daily-plans", dailyPlanRoutes);
app.use("/api/v1/logs", logRoutes);
app.use("/api/v1/goals", goalRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/habits", habitRoutes);
app.use("/api/v1/exercise", exerciseRoutes);
app.use("/api/v1/learning", learningRoutes);
app.use("/api/v1/hobbies", hobbyRoutes);
app.use("/api/v1/college", collegeRoutes);
app.use("/api/v1/internships", internshipRoutes);
app.use("/api/v1/hackathons", hackathonRoutes);
app.use("/api/v1/settings", settingsRoutes);

if (env.NODE_ENV === "production" && env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

app.use(errorHandler);
