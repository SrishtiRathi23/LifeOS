export const premiumSections = new Set([
  "/vision-board",
  "/expenses",
  "/college",
  "/internships",
  "/hackathons",
  "/exercise",
  "/learning",
  "/hobbies"
]);

export const paidFeatureCopy: Record<string, { title: string; description: string }> = {
  "/vision-board": {
    title: "Premium Vision Board",
    description: "Unlimited images, boards, export polish, and long-term planning are premium because users pay for identity-level motivation tools."
  },
  "/expenses": {
    title: "Premium Money System",
    description: "Budgets, recurring expenses, and exportable finance views are premium because they directly help users save money."
  },
  "/college": {
    title: "Premium College Tracker",
    description: "Attendance, assignments, exams, and smart reminders are premium because students use them every week."
  },
  "/internships": {
    title: "Premium Career Tracker",
    description: "Pipeline tracking, deadlines, and interview notes are premium because they help users win opportunities."
  },
  "/hackathons": {
    title: "Premium Hackathon Hub",
    description: "Idea tracking, team notes, and submission planning are premium power tools for active builders."
  },
  "/exercise": {
    title: "Premium Fitness Log",
    description: "Exercise trends and detailed wellness tracking are premium add-ons for users who want deeper accountability."
  },
  "/learning": {
    title: "Premium Learning Tracker",
    description: "Course goals, study hours, and certificate tracking are premium because they support career growth."
  },
  "/hobbies": {
    title: "Premium Hobbies",
    description: "Creative and personal time analytics are premium for users who want a balanced life system."
  }
};

export function isPremiumPath(pathname: string) {
  return premiumSections.has(pathname);
}
