/*
  Warnings:

  - The `speciality` column on the `hospital_details` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `feature` column on the `hospital_details` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "hospital_details" DROP COLUMN "speciality",
ADD COLUMN     "speciality" JSONB,
DROP COLUMN "feature",
ADD COLUMN     "feature" JSONB;
