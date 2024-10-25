/*
  Warnings:

  - You are about to alter the column `total_amount` on the `sales_order` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "sales_order" ALTER COLUMN "total_amount" SET DATA TYPE DECIMAL(10,2);
