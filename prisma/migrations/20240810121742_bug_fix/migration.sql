/*
  Warnings:

  - You are about to drop the column `user_id` on the `sales_order` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "sales_order" DROP CONSTRAINT "sales_order_user_id_fkey";

-- AlterTable
ALTER TABLE "sales_order" DROP COLUMN "user_id",
ADD COLUMN     "customer_id" INTEGER;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "user_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;
