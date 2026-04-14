import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: "../.env" });
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPEN_METEO_BASE_URL: z.string().default("https://api.open-meteo.com/v1")
});

export const env = envSchema.parse(process.env);
