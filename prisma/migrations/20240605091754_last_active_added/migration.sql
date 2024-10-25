-- AlterTable
ALTER TABLE "hospital_details" ADD COLUMN     "last_active" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "lab_details" ADD COLUMN     "last_active" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_details" ADD COLUMN     "last_active" TIMESTAMP(3);
