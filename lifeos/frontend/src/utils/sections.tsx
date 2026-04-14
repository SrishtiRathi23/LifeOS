import type { LucideIcon } from "lucide-react";
import {
  BookHeart,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  CalendarDays,
  ClipboardList,
  DollarSign,
  Dumbbell,
  Goal,
  GraduationCap,
  HeartPulse,
  Home,
  Image,
  Lightbulb,
  NotebookPen,
  Settings
} from "lucide-react";
import type { ComponentType } from "react";

export type SectionItem = {
  title: string;
  path: string;
  icon: LucideIcon;
  loader: () => Promise<{ default?: ComponentType; [key: string]: unknown }>;
  mobilePrimary?: boolean;
};

export const sectionRegistry: SectionItem[] = [
  { title: "Dashboard", path: "/", icon: Home, loader: () => import("@/pages/DashboardPage"), mobilePrimary: true },
  { title: "Daily Planner", path: "/daily-planner", icon: ClipboardList, loader: () => import("@/pages/DailyPlannerPage"), mobilePrimary: true },
  { title: "Weekly View", path: "/weekly-view", icon: CalendarDays, loader: () => import("@/pages/WeeklyViewPage"), mobilePrimary: true },
  { title: "Monthly View", path: "/monthly-view", icon: Calendar, loader: () => import("@/pages/MonthlyViewPage"), mobilePrimary: true },
  { title: "Diary / Journal", path: "/diary", icon: NotebookPen, loader: () => import("@/pages/DiaryPage"), mobilePrimary: true },
  { title: "Goals & Aspirations", path: "/goals", icon: Goal, loader: () => import("@/pages/GoalsPage") },
  { title: "Vision Board", path: "/vision-board", icon: Image, loader: () => import("@/pages/VisionBoardPage") },
  { title: "Expense Tracker", path: "/expenses", icon: DollarSign, loader: () => import("@/pages/ExpensesPage") },
  { title: "College Tracker", path: "/college", icon: GraduationCap, loader: () => import("@/pages/CollegePage") },
  { title: "Internship Tracker", path: "/internships", icon: BriefcaseBusiness, loader: () => import("@/pages/InternshipsPage") },
  { title: "Hackathon Tracker", path: "/hackathons", icon: Lightbulb, loader: () => import("@/pages/HackathonsPage") },
  { title: "Wellness & Habits", path: "/wellness", icon: HeartPulse, loader: () => import("@/pages/WellnessPage") },
  { title: "Exercise Log", path: "/exercise", icon: Dumbbell, loader: () => import("@/pages/ExercisePage") },
  { title: "Learning Tracker", path: "/learning", icon: BookOpen, loader: () => import("@/pages/LearningPage") },
  { title: "Hobbies", path: "/hobbies", icon: BookHeart, loader: () => import("@/pages/HobbiesPage") },
  { title: "Settings", path: "/settings", icon: Settings, loader: () => import("@/pages/SettingsPage") }
];
