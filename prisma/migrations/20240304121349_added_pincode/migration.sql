/*
  Warnings:

  - You are about to drop the column `lisence_no` on the `hospital_details` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "hospital_details" DROP COLUMN "lisence_no",
ADD COLUMN     "licence_no" TEXT,
ADD COLUMN     "pincode" INTEGER;
