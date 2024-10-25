/*
  Warnings:

  - The `created_date` column on the `medicine_timetable` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "medicine_timetable" ADD COLUMN     "daysInterval" TEXT,
DROP COLUMN "created_date",
ADD COLUMN     "created_date" TIMESTAMP(3);
