import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  CLIENT_URLS: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // AI & External
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  OPEN_METEO_BASE_URL: z.string().default("https://api.open-meteo.com/v1"),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
export const config = {
  ...env,
  geminiApiKey: env.GEMINI_API_KEY
};

if (env.NODE_ENV === "production") {
  if (env.JWT_SECRET.length < 32 || env.JWT_SECRET.includes("your-")) {
    throw new Error("JWT_SECRET must be a strong production secret.");
  }

  if (!env.CLIENT_URL.startsWith("https://")) {
    throw new Error("CLIENT_URL must use HTTPS in production.");
  }
}

export const allowedClientOrigins =
  env.NODE_ENV === "production"
    ? (env.CLIENT_URLS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [env.CLIENT_URL])
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:4173", "http://127.0.0.1:4173"];
