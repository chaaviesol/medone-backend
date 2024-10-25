/*
  Warnings:

  - You are about to drop the column `subcategory` on the `generic_product` table. All the data in the column will be lost.
  - The `category` column on the `generic_product` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "generic_product" DROP COLUMN "subcategory",
DROP COLUMN "category",
ADD COLUMN     "category" JSONB;
