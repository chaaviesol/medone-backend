/*
  Warnings:

  - You are about to drop the `prescription_data` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "prescription_data" DROP CONSTRAINT "prescription_data_sales_id_fkey";

-- AlterTable
ALTER TABLE "sales_order" ADD COLUMN     "patient_name" TEXT,
ADD COLUMN     "prescription_image" JSONB;

-- DropTable
DROP TABLE "prescription_data";
