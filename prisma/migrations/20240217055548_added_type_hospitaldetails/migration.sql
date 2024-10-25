/*
  Warnings:

  - The `address` column on the `hospital_details` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `feature` column on the `hospital_details` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "hospital_details" ADD COLUMN     "type" TEXT,
DROP COLUMN "address",
ADD COLUMN     "address" JSONB,
DROP COLUMN "feature",
ADD COLUMN     "feature" JSONB;
