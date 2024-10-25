/*
  Warnings:

  - The `main_type` column on the `CategoryManager` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `services` column on the `CategoryManager` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `features` column on the `CategoryManager` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "CategoryManager" DROP COLUMN "main_type",
ADD COLUMN     "main_type" TEXT[],
DROP COLUMN "services",
ADD COLUMN     "services" TEXT[],
DROP COLUMN "features",
ADD COLUMN     "features" TEXT[];
