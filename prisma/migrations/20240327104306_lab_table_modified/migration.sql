/*
  Warnings:

  - You are about to drop the column `lisence_no` on the `lab_details` table. All the data in the column will be lost.
  - The `address` column on the `lab_details` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "lab_details" DROP COLUMN "lisence_no",
ADD COLUMN     "features" JSONB,
ADD COLUMN     "license_no" TEXT,
ADD COLUMN     "services" JSONB,
DROP COLUMN "address",
ADD COLUMN     "address" JSONB;
