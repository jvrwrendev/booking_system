-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- This can be worked around by creating multiple migrations, each migration adding only one value to the enum.


ALTER TYPE "Role" ADD VALUE 'AGENT';
ALTER TYPE "Role" ADD VALUE 'BRANCH';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "agentId" TEXT,
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "contactNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_agentId_key" ON "users"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "users_branchId_key" ON "users"("branchId");
