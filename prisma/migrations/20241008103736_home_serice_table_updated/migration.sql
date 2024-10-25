/*
  Warnings:

  - You are about to drop the column `address` on the `home_services` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `home_services` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `home_services` table. All the data in the column will be lost.
  - You are about to drop the column `pincode` on the `home_services` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `home_services` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "home_services" DROP COLUMN "address",
DROP COLUMN "department",
DROP COLUMN "end_date",
DROP COLUMN "pincode",
DROP COLUMN "start_date";
