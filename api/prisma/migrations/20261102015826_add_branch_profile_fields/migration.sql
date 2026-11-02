-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "address" TEXT,
ADD COLUMN     "addressParts" JSONB,
ADD COLUMN     "contactNumber" TEXT,
ADD COLUMN     "manager" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "addressParts" JSONB;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
