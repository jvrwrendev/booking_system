import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log("Database connected");
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(
      `Agrivet API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`,
    );
  });
}

bootstrap();