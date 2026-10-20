import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/argon2.js";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@agrivet.local";
  const name = process.env.SEED_ADMIN_NAME ?? "System Administrator";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "StrongPass!2026";

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`Seeded SUPER_ADMIN: ${admin.email} (id: ${admin.id})`);

  const demoPassword = await hashPassword(password);

  const agent = await prisma.user.upsert({
    where: { email: "agent@agrivet.local" },
    update: {},
    create: {
      name: "Demo Agent",
      email: "agent@agrivet.local",
      passwordHash: demoPassword,
      role: "AGENT",
      status: "ACTIVE",
      contactNumber: "+63 917 555 0101",
      address: "San Pablo City, Laguna",
      agentId: "AGT-DEMO0001",
    },
  });

  console.log(`Seeded AGENT: ${agent.email} (agentId: ${agent.agentId})`);

  const branch = await prisma.user.upsert({
    where: { email: "branch@agrivet.local" },
    update: {},
    create: {
      name: "Demo Branch",
      email: "branch@agrivet.local",
      passwordHash: demoPassword,
      role: "BRANCH",
      status: "ACTIVE",
      contactNumber: "+63 917 555 0102",
      address: "Calamba City, Laguna",
      branchId: "BR-DEMO0001",
    },
  });

  console.log(`Seeded BRANCH: ${branch.email} (branchId: ${branch.branchId})`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());