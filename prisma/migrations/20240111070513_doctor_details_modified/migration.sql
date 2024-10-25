/*
  Warnings:

  - You are about to drop the column `quatation_id` on the `pharmacy_response_table` table. All the data in the column will be lost.
  - You are about to drop the `quatation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "quatation" DROP CONSTRAINT "quatation_user_id_fkey";

-- AlterTable
ALTER TABLE "pharmacy_response_table" DROP COLUMN "quatation_id",
ADD COLUMN     "quotation_id" INTEGER;

-- DropTable
DROP TABLE "quatation";

-- CreateTable
CREATE TABLE "quotation" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file" JSONB NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL,
    "accepted_pharmacy" INTEGER,

    CONSTRAINT "quotation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "doctor_hospital" ADD CONSTRAINT "doctor_hospital_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospital_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_hospital" ADD CONSTRAINT "doctor_hospital_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
