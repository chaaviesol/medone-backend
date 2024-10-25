/*
  Warnings:

  - You are about to drop the column `days` on the `doctor_hospital` table. All the data in the column will be lost.
  - You are about to drop the column `timing` on the `doctor_hospital` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "doctor_hospital" DROP COLUMN "days",
DROP COLUMN "timing",
ADD COLUMN     "days_timing" JSONB;
