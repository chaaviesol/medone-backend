/*
  Warnings:

  - The `experience` column on the `doctor_details` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "doctor_details" ADD COLUMN     "pincode" INTEGER,
DROP COLUMN "experience",
ADD COLUMN     "experience" INTEGER;
