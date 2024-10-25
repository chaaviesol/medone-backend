/*
  Warnings:

  - The `preferred_location` column on the `career` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "career" ADD COLUMN     "gender" TEXT,
ADD COLUMN     "specialization" TEXT,
ADD COLUMN     "year_of_passout" TEXT,
DROP COLUMN "preferred_location",
ADD COLUMN     "preferred_location" JSONB;
