-- CreateEnum
CREATE TYPE "BranchOrderStatus" AS ENUM ('PENDING', 'ACCEPTED', 'ASSIGNED', 'ADMIN_ACCEPTED', 'PROCESSING', 'READY', 'COMPLETED', 'READY_FOR_DELIVERY', 'REJECTED');

-- CreateTable
CREATE TABLE "branch_orders" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "branchManager" TEXT,
    "branchContact" TEXT,
    "branchAddress" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "status" "BranchOrderStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "assignedAdminId" TEXT,
    "assignedAdminName" TEXT,
    "assignedById" TEXT,
    "assignedByName" TEXT,
    "assignmentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_order_items" (
    "id" TEXT NOT NULL,
    "branchOrderId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branch_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_order_status_history" (
    "id" TEXT NOT NULL,
    "branchOrderId" TEXT NOT NULL,
    "fromStatus" "BranchOrderStatus",
    "toStatus" "BranchOrderStatus" NOT NULL,
    "label" TEXT NOT NULL,
    "byName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branch_order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branch_orders_reference_key" ON "branch_orders"("reference");

-- CreateIndex
CREATE INDEX "branch_orders_status_createdAt_idx" ON "branch_orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "branch_orders_branchId_createdAt_idx" ON "branch_orders"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "branch_orders_assignedAdminId_idx" ON "branch_orders"("assignedAdminId");

-- CreateIndex
CREATE INDEX "branch_orders_orderDate_idx" ON "branch_orders"("orderDate");

-- CreateIndex
CREATE INDEX "branch_order_items_branchOrderId_idx" ON "branch_order_items"("branchOrderId");

-- CreateIndex
CREATE INDEX "branch_order_items_productId_idx" ON "branch_order_items"("productId");

-- CreateIndex
CREATE INDEX "branch_order_status_history_branchOrderId_createdAt_idx" ON "branch_order_status_history"("branchOrderId", "createdAt");

-- AddForeignKey
ALTER TABLE "branch_orders" ADD CONSTRAINT "branch_orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_orders" ADD CONSTRAINT "branch_orders_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_orders" ADD CONSTRAINT "branch_orders_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_order_items" ADD CONSTRAINT "branch_order_items_branchOrderId_fkey" FOREIGN KEY ("branchOrderId") REFERENCES "branch_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_order_items" ADD CONSTRAINT "branch_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_order_status_history" ADD CONSTRAINT "branch_order_status_history_branchOrderId_fkey" FOREIGN KEY ("branchOrderId") REFERENCES "branch_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
