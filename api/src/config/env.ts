import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  SESSION_TTL: z.string().regex(/^\d+[smhd]$/, "Invalid session TTL").default("24h"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  SEED_ADMIN_NAME: z.string().default("System Administrator"),
  SEED_ADMIN_EMAIL: z.string().email().default("admin@agrivet.local"),
  SEED_ADMIN_PASSWORD: z.string().min(8).default("StrongPass!2026"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    console.error(`Invalid environment variables:\n${issues}`);
    process.exit(1);
  }

  return {
    ...parsed.data,
    corsOrigins: parsed.data.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    isProduction: parsed.data.NODE_ENV === "production",
  };
}

export const env = loadEnv();