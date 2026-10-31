-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'REVIEW_ORDER';

-- AlterEnum
ALTER TYPE "BranchOrderStatus" ADD VALUE 'REVIEW_ORDER';

-- AlterTable
ALTER TABLE "branch_orders" ADD COLUMN     "agentAssignmentDate" TIMESTAMP(3),
ADD COLUMN     "assignedAgentById" TEXT,
ADD COLUMN     "assignedAgentByName" TEXT,
ADD COLUMN     "assignedAgentId" TEXT,
ADD COLUMN     "assignedAgentName" TEXT;

-- CreateIndex
CREATE INDEX "branch_orders_assignedAgentId_idx" ON "branch_orders"("assignedAgentId");

-- AddForeignKey
ALTER TABLE "branch_orders" ADD CONSTRAINT "branch_orders_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_orders" ADD CONSTRAINT "branch_orders_assignedAgentById_fkey" FOREIGN KEY ("assignedAgentById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
