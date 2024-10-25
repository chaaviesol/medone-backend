/*
  Warnings:

  - The `timing` column on the `lab_details` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "lab_details" DROP COLUMN "timing",
ADD COLUMN     "timing" JSONB;
