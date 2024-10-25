/*
  Warnings:

  - You are about to drop the column `doctor_remarks` on the `second_opinion_data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customer_cart" ADD COLUMN     "created_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "second_opinion_data" DROP COLUMN "doctor_remarks",
ADD COLUMN     "doctor_remarksid" INTEGER,
ADD COLUMN     "type" TEXT;

-- CreateTable
CREATE TABLE "doctor_remarks" (
    "id" SERIAL NOT NULL,
    "query_id" INTEGER,
    "doctor_id" INTEGER,
    "doctor_remarks" TEXT,

    CONSTRAINT "doctor_remarks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "doctor_remarks" ADD CONSTRAINT "doctor_remarks_id_fkey" FOREIGN KEY ("id") REFERENCES "second_opinion_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_remarks" ADD CONSTRAINT "doctor_remarks_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;
