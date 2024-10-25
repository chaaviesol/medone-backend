/*
  Warnings:

  - You are about to drop the column `doctor_remarksid` on the `second_opinion_data` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `second_opinion_data` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "doctor_remarks" DROP CONSTRAINT "doctor_remarks_id_fkey";

-- AlterTable
ALTER TABLE "second_opinion_data" DROP COLUMN "doctor_remarksid",
DROP COLUMN "type",
ADD COLUMN     "doctor_remarks" TEXT;

-- CreateTable
CREATE TABLE "query_data" (
    "id" SERIAL NOT NULL,
    "department" TEXT,
    "query" TEXT,
    "status" TEXT,
    "user_id" INTEGER,
    "doctor_remarksid" INTEGER,
    "created_date" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_date" TIMESTAMP(3),

    CONSTRAINT "query_data_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "query_data" ADD CONSTRAINT "query_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_remarks" ADD CONSTRAINT "doctor_remarks_id_fkey" FOREIGN KEY ("id") REFERENCES "query_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
