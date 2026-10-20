import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/argon2.js";
import { computeStockStatus, deriveProductStatus } from "../src/lib/stock.js";

const prisma = new PrismaClient();

interface SeedCategory {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface SeedBranch {
  id: string;
  name: string;
  code: string;
  status: string;
}

interface SeedProduct {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  brand?: string;
  description?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minimumStockLevel: number;
  supplier?: string;
  status: string;
  image?: string;
}

const catalog = JSON.parse(
  readFileSync(new URL("./catalog-seed.json", import.meta.url), "utf8"),
) as {
  categories: SeedCategory[];
  branches: SeedBranch[];
  products: SeedProduct[];
};

// Deterministic branch allocation used only to create opening stock. The
// per-branch quantities always add back up to the product's total.
const BRANCH_WEIGHTS = [0.4, 0.2, 0.15, 0.1, 0.07, 0.05, 0.03];

async function seedUsers() {
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

  const branchUser = await prisma.user.upsert({
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

  console.log(
    `Seeded BRANCH: ${branchUser.email} (branchId: ${branchUser.branchId})`,
  );

  return admin;
}

async function seedCategories() {
  const idMap = new Map<string, string>();

  for (const category of catalog.categories) {
    const existing = await prisma.category.findFirst({
      where: { name: { equals: category.name, mode: "insensitive" } },
    });

    const record = existing
      ? await prisma.category.update({
          where: { id: existing.id },
          data: { description: category.description },
        })
      : await prisma.category.create({
          data: {
            id: category.id,
            name: category.name,
            description: category.description,
            status: category.status === "active" ? "ACTIVE" : "INACTIVE",
          },
        });

    idMap.set(category.id, record.id);
  }

  console.log(`Seeded ${catalog.categories.length} categories`);
  return idMap;
}

async function seedBranches() {
  for (const branch of catalog.branches) {
    await prisma.branch.upsert({
      where: { id: branch.id },
      update: { name: branch.name, code: branch.code },
      create: {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        status: branch.status === "active" ? "ACTIVE" : "INACTIVE",
      },
    });
  }

  console.log(`Seeded ${catalog.branches.length} branches`);
}

async function seedSuppliers(): Promise<Map<string, string>> {
  const names = [
    ...new Set(
      catalog.products
        .map((product) => product.supplier?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const idMap = new Map<string, string>();

  for (const name of names) {
    const supplier = await prisma.supplier.upsert({
      where: { name },
      update: {},
      create: { name, status: "ACTIVE" },
    });
    idMap.set(name.toLowerCase(), supplier.id);
  }

  console.log(`Seeded ${names.length} suppliers`);
  return idMap;
}

async function seedProducts(
  admin: { id: string; name: string },
  categoryIdMap: Map<string, string>,
  supplierIdMap: Map<string, string>,
) {
  let created = 0;

  for (const product of catalog.products) {
    const categoryId = categoryIdMap.get(product.categoryId) ?? null;
    const stockStatus = computeStockStatus(
      product.stockQuantity,
      product.minimumStockLevel,
    );
    const catalogStatus =
      product.status === "inactive"
        ? "INACTIVE"
        : deriveProductStatus("ACTIVE", product.stockQuantity);

    const supplierId = product.supplier
      ? (supplierIdMap.get(product.supplier.trim().toLowerCase()) ?? null)
      : null;

    const record = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        categoryId,
        supplierId,
        brand: product.brand ?? null,
        description: product.description ?? null,
        unit: product.unit,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        stockQuantity: product.stockQuantity,
        minimumStockLevel: product.minimumStockLevel,
        supplier: product.supplier ?? null,
        status: catalogStatus,
        stockStatus,
        image: product.image ?? null,
      },
    });

    const existingRows = await prisma.inventoryStock.findMany({
      where: { productId: record.id },
      select: { id: true },
    });

    if (existingRows.length > 0) continue;

    let remaining = product.stockQuantity;
    const allocations = catalog.branches.map((branch, index) => {
      const weight = BRANCH_WEIGHTS[index] ?? 0;
      const quantity = Math.floor(product.stockQuantity * weight);
      remaining -= quantity;
      return { branchId: branch.id, quantity };
    });

    const first = allocations[0];
    if (first) first.quantity += remaining;

    for (const allocation of allocations) {
      const status = computeStockStatus(
        allocation.quantity,
        product.minimumStockLevel,
      );

      await prisma.inventoryStock.create({
        data: {
          productId: record.id,
          branchId: allocation.branchId,
          currentStock: allocation.quantity,
          minimumStock: product.minimumStockLevel,
          status,
        },
      });

      if (allocation.quantity > 0) {
        await prisma.inventoryTransaction.create({
          data: {
            productId: record.id,
            branchId: allocation.branchId,
            type: "STOCK_IN",
            quantity: allocation.quantity,
            previousStock: 0,
            newStock: allocation.quantity,
            reason: "Opening stock",
            performedById: admin.id,
            performedByName: admin.name,
            referenceType: "PRODUCT_OPENING",
            referenceId: `${record.id}:${allocation.branchId}`,
          },
        });
      }
    }

    created += 1;
  }

  console.log(`Seeded ${created} products with opening stock`);
}

async function main() {
  const admin = await seedUsers();
  const categoryIdMap = await seedCategories();
  await seedBranches();
  const supplierIdMap = await seedSuppliers();
  await seedProducts(admin, categoryIdMap, supplierIdMap);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
