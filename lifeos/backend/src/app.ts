import express from "express";
import "express-async-errors";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { env } from "./utils/env.js";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import diaryRoutes from "./routes/diary.js";
import visionRoutes from "./routes/vision.js";
import settingsRoutes from "./routes/settings.js";
import dashboardRoutes from "./routes/dashboard.js";
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
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "You have reached the hourly AI limit. Please try again later." }
});

app.use(
  cors({
    origin: [env.CLIENT_URL, "http://localhost:5174"],
    credentials: true
  })
);
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', env.CLIENT_URL || '*')
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  next()
}, express.static(path.resolve("uploads")));

app.get("/api/v1/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authRoutes);
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

app.use(errorHandler);
