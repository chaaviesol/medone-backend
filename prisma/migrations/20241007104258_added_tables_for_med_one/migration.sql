/*
  Warnings:

  - You are about to drop the column `is_prescriped` on the `medicines` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "medicines" DROP COLUMN "is_prescriped",
ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "user_details" ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "health_condition" TEXT,
ADD COLUMN     "height" TEXT,
ADD COLUMN     "weight" TEXT;

-- CreateTable
CREATE TABLE "dailyRoutine" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "routine" JSONB,
    "created_date" TIMESTAMP(3),

    CONSTRAINT "dailyRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_timetable" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "medicine" JSONB,
    "medicine_type" TEXT,
    "image" TEXT,
    "startDate" TEXT,
    "no_of_days" TEXT,
    "afterFd_beforeFd" TEXT,
    "totalQuantity" TEXT,
    "timing" JSONB,
    "timeInterval" TEXT,
    "takingQuantity" TEXT,
    "created_date" TEXT,

    CONSTRAINT "medicine_timetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_records" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "timetable_id" INTEGER,
    "status" TEXT,
    "taken_time" TEXT,
    "taken_status" TEXT,
    "created_date" TIMESTAMP(3),

    CONSTRAINT "medication_records_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "dailyRoutine" ADD CONSTRAINT "dailyRoutine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_timetable" ADD CONSTRAINT "medicine_timetable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;
