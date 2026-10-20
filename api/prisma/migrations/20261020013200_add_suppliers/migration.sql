-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "supplierId" TEXT;

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "contactNumber" TEXT,
    "address" TEXT,
    "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");

-- CreateIndex
CREATE INDEX "suppliers_status_idx" ON "suppliers"("status");

-- CreateIndex
CREATE INDEX "products_supplierId_idx" ON "products"("supplierId");

-- Backfill suppliers from the legacy free-text product supplier column.
INSERT INTO "suppliers" ("id", "name", "status", "createdAt", "updatedAt")
SELECT
    'sup_' || substr(md5(lower(btrim("supplier"))), 1, 24),
    min(btrim("supplier")),
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "products"
WHERE "supplier" IS NOT NULL AND btrim("supplier") <> ''
GROUP BY lower(btrim("supplier"));

UPDATE "products" AS p
SET "supplierId" = s."id"
FROM "suppliers" AS s
WHERE p."supplier" IS NOT NULL
  AND lower(btrim(p."supplier")) = lower(s."name");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
