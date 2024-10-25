-- DropForeignKey
ALTER TABLE "doctor_searchdata" DROP CONSTRAINT "doctor_searchdata_user_id_fkey";

-- DropForeignKey
ALTER TABLE "hospital_searchdata" DROP CONSTRAINT "hospital_searchdata_user_id_fkey";

-- DropForeignKey
ALTER TABLE "lab_searchdata" DROP CONSTRAINT "lab_searchdata_user_id_fkey";

-- AlterTable
ALTER TABLE "doctor_searchdata" ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "hospital_searchdata" ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "lab_searchdata" ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "doctor_searchdata" ADD CONSTRAINT "doctor_searchdata_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_searchdata" ADD CONSTRAINT "hospital_searchdata_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_searchdata" ADD CONSTRAINT "lab_searchdata_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;
