/*
  Warnings:

  - You are about to drop the column `photo` on the `user_details` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_details" DROP COLUMN "photo",
ADD COLUMN     "image" TEXT;

-- CreateTable
CREATE TABLE "medicines" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "is_prescriped" BOOLEAN,
    "status" TEXT,
    "created_date" TIMESTAMP(3),
    "created_by" INTEGER,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);
