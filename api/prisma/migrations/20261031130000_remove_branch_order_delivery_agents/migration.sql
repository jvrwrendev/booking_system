-- DropForeignKey
ALTER TABLE "branch_orders" DROP CONSTRAINT "branch_orders_assignedAgentById_fkey";

-- DropForeignKey
ALTER TABLE "branch_orders" DROP CONSTRAINT "branch_orders_assignedAgentId_fkey";

-- DropIndex
DROP INDEX "branch_orders_assignedAgentId_idx";

-- AlterTable
ALTER TABLE "branch_orders" DROP COLUMN "agentAssignmentDate",
DROP COLUMN "assignedAgentById",
DROP COLUMN "assignedAgentByName",
DROP COLUMN "assignedAgentId",
DROP COLUMN "assignedAgentName";
