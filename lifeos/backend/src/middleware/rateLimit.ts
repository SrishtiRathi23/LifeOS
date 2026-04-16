import rateLimit from "express-rate-limit";

// General requests (Dashboard, small items)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication (Login / Register) - Very strict
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 15,
  message: { error: "Too many login attempts. Please wait 15 minutes." },
});

// AI Usage (Reflections, Vision parsing)
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: "AI request limit reached. Resets in 1 hour." },
});
