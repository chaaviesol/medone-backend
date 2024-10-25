/*
  Warnings:

  - The `health_condition` column on the `user_details` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "medicine_timetable" ADD COLUMN     "active_status" TEXT;

-- AlterTable
ALTER TABLE "user_details" DROP COLUMN "health_condition",
ADD COLUMN     "health_condition" JSONB;

-- CreateTable
CREATE TABLE "notification" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "message" TEXT,
    "status" TEXT,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);
