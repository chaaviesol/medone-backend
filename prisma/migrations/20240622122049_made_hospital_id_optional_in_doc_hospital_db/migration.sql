-- DropForeignKey
ALTER TABLE "doctor_hospital" DROP CONSTRAINT "doctor_hospital_hospital_id_fkey";

-- AlterTable
ALTER TABLE "doctor_hospital" ALTER COLUMN "hospital_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "doctor_hospital" ADD CONSTRAINT "doctor_hospital_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospital_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;
