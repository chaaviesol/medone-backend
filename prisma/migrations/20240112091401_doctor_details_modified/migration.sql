/*
  Warnings:

  - You are about to drop the column `experince` on the `doctor_details` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "doctor_details" DROP COLUMN "experince",
ADD COLUMN     "experience" TEXT;
