/*
  Warnings:

  - The `address` column on the `doctor_details` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "doctor_details" DROP COLUMN "address",
ADD COLUMN     "address" JSONB;
