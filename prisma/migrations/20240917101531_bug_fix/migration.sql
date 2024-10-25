-- DropForeignKey
ALTER TABLE "doctor_remarks" DROP CONSTRAINT "doctor_remarks_id_fkey";

-- AddForeignKey
ALTER TABLE "doctor_remarks" ADD CONSTRAINT "doctor_remarks_query_id_fkey" FOREIGN KEY ("query_id") REFERENCES "query_data"("id") ON DELETE SET NULL ON UPDATE CASCADE;
