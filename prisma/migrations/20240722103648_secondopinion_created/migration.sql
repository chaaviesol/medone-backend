/*
  Warnings:

  - You are about to drop the column `password` on the `pharmacy_details` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `pharmacy_details` table. All the data in the column will be lost.
  - You are about to drop the column `timing` on the `pharmacy_details` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `pharmacy_details` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `sales_list` table. All the data in the column will be lost.
  - You are about to drop the column `modified_by` on the `sales_list` table. All the data in the column will be lost.
  - You are about to drop the column `modified_date` on the `sales_list` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `sales_order` table. All the data in the column will be lost.
  - You are about to drop the column `prescription_image` on the `sales_order` table. All the data in the column will be lost.
  - The `updated_by` column on the `sales_order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `pharmacy_response_table` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `services` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `type_table` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "pharmacy_response_table" DROP CONSTRAINT "pharmacy_response_table_pharmacy_id_fkey";

-- AlterTable
ALTER TABLE "pharmacy_details" DROP COLUMN "password",
DROP COLUMN "rating",
DROP COLUMN "timing",
DROP COLUMN "type",
ADD COLUMN     "created_by" INTEGER,
ADD COLUMN     "pincode" INTEGER;

-- AlterTable
ALTER TABLE "sales_list" DROP COLUMN "created_by",
DROP COLUMN "modified_by",
DROP COLUMN "modified_date";

-- AlterTable
ALTER TABLE "sales_order" DROP COLUMN "created_by",
DROP COLUMN "prescription_image",
DROP COLUMN "updated_by",
ADD COLUMN     "updated_by" INTEGER;

-- DropTable
DROP TABLE "pharmacy_response_table";

-- DropTable
DROP TABLE "services";

-- DropTable
DROP TABLE "type_table";

-- CreateTable
CREATE TABLE "prescription_data" (
    "id" SERIAL NOT NULL,
    "sales_id" INTEGER,
    "prescription_image" JSONB,
    "created_date" TIMESTAMP(3),

    CONSTRAINT "prescription_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "second_opinion_data" (
    "id" SERIAL NOT NULL,
    "report_image" JSONB,
    "patient_name" TEXT,
    "doctor_name" TEXT,
    "alternative_number" TEXT,
    "remarks" TEXT,
    "status" TEXT,
    "user_id" INTEGER,
    "created_date" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_date" TIMESTAMP(3),

    CONSTRAINT "second_opinion_data_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "prescription_data" ADD CONSTRAINT "prescription_data_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "sales_order"("sales_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "second_opinion_data" ADD CONSTRAINT "second_opinion_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;
