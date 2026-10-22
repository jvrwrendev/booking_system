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

  NODEMAIL_USER: z
    .string()
    .trim()
    .email("NODEMAIL_USER must be a valid Gmail address"),
  NODEMAIL_PASS: z
    .string()
    .transform((value) => value.replace(/\s+/g, ""))
    .pipe(z.string().min(1, "NODEMAIL_PASS is required")),
  NODEMAIL_FROM_NAME: z.string().default("Agrivet Supply"),
  // Optional SMTP overrides. Defaults are Gmail with STARTTLS on port 587.
  NODEMAIL_HOST: z.string().trim().default("smtp.gmail.com"),
  NODEMAIL_PORT: z.coerce.number().int().positive().default(587),
  NODEMAIL_SECURE: z
    .string()
    .default("false")
    .transform((value) => value.toLowerCase() === "true"),
  NODEMAIL_REQUIRE_TLS: z
    .string()
    .default("true")
    .transform((value) => value.toLowerCase() === "true"),

  EMAIL_VERIFICATION_TTL: z.string().regex(/^\d+[smhd]$/, "Invalid TTL").default("10m"),
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