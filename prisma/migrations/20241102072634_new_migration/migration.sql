/*
  Warnings:

  - You are about to drop the `CategoryManager` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `adm_notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `admin_details` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `campaigns` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `career` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `career_category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat_data` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `customer_cart` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doctor_details` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doctor_feedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doctor_hospital` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doctor_interacteduser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doctor_remarks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doctor_searchdata` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `home_services` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hospital_feedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hospital_interacteduser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hospital_searchdata` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lab_details` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lab_feedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lab_interacteduser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lab_searchdata` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `offer_data` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pharmacy_details` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pincode_data` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `productcategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `query_data` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quotation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sales_invoice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sales_list` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sales_order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `second_opinion_data` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `specialization_data` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `type_notification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "customer_cart" DROP CONSTRAINT "customer_cart_prod_id_fkey";

-- DropForeignKey
ALTER TABLE "customer_cart" DROP CONSTRAINT "customer_cart_user_id_fkey";

-- DropForeignKey
ALTER TABLE "doctor_feedback" DROP CONSTRAINT "doctor_feedback_doctor_id_fkey";

-- DropForeignKey
ALTER TABLE "doctor_feedback" DROP CONSTRAINT "doctor_feedback_user_id_fkey";

-- DropForeignKey
ALTER TABLE "doctor_hospital" DROP CONSTRAINT "doctor_hospital_doctor_id_fkey";

-- DropForeignKey
ALTER TABLE "doctor_hospital" DROP CONSTRAINT "doctor_hospital_hospital_id_fkey";

-- DropForeignKey
ALTER TABLE "doctor_interacteduser" DROP CONSTRAINT "doctor_interacteduser_doctor_id_fkey";

-- DropForeignKey
ALTER TABLE "doctor_interacteduser" DROP CONSTRAINT "doctor_interacteduser_user_id_fkey";

-- DropForeignKey
ALTER TABLE "doctor_remarks" DROP CONSTRAINT "doctor_remarks_doctor_id_fkey";

-- DropForeignKey
ALTER TABLE "doctor_remarks" DROP CONSTRAINT "doctor_remarks_query_id_fkey";

-- DropForeignKey
ALTER TABLE "doctor_searchdata" DROP CONSTRAINT "doctor_searchdata_user_id_fkey";

-- DropForeignKey
ALTER TABLE "hospital_feedback" DROP CONSTRAINT "hospital_feedback_hospital_id_fkey";

-- DropForeignKey
ALTER TABLE "hospital_feedback" DROP CONSTRAINT "hospital_feedback_user_id_fkey";

-- DropForeignKey
ALTER TABLE "hospital_interacteduser" DROP CONSTRAINT "hospital_interacteduser_hospital_id_fkey";

-- DropForeignKey
ALTER TABLE "hospital_interacteduser" DROP CONSTRAINT "hospital_interacteduser_user_id_fkey";

-- DropForeignKey
ALTER TABLE "hospital_searchdata" DROP CONSTRAINT "hospital_searchdata_user_id_fkey";

-- DropForeignKey
ALTER TABLE "lab_feedback" DROP CONSTRAINT "lab_feedback_lab_id_fkey";

-- DropForeignKey
ALTER TABLE "lab_feedback" DROP CONSTRAINT "lab_feedback_user_id_fkey";

-- DropForeignKey
ALTER TABLE "lab_interacteduser" DROP CONSTRAINT "lab_interacteduser_lab_id_fkey";

-- DropForeignKey
ALTER TABLE "lab_interacteduser" DROP CONSTRAINT "lab_interacteduser_user_id_fkey";

-- DropForeignKey
ALTER TABLE "lab_searchdata" DROP CONSTRAINT "lab_searchdata_user_id_fkey";

-- DropForeignKey
ALTER TABLE "offer_data" DROP CONSTRAINT "offer_data_lab_id_fkey";

-- DropForeignKey
ALTER TABLE "query_data" DROP CONSTRAINT "query_data_user_id_fkey";

-- DropForeignKey
ALTER TABLE "quotation" DROP CONSTRAINT "quotation_user_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_invoice" DROP CONSTRAINT "sales_invoice_sales_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_list" DROP CONSTRAINT "sales_list_product_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_list" DROP CONSTRAINT "sales_list_sales_id_fkey";

-- DropForeignKey
ALTER TABLE "sales_order" DROP CONSTRAINT "sales_order_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "second_opinion_data" DROP CONSTRAINT "second_opinion_data_user_id_fkey";

-- AlterTable
ALTER TABLE "medicine_timetable" ADD COLUMN     "app_flag" BOOLEAN;

-- AlterTable
ALTER TABLE "notification" ADD COLUMN     "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "CategoryManager";

-- DropTable
DROP TABLE "adm_notification";

-- DropTable
DROP TABLE "admin_details";

-- DropTable
DROP TABLE "campaigns";

-- DropTable
DROP TABLE "career";

-- DropTable
DROP TABLE "career_category";

-- DropTable
DROP TABLE "chat_data";

-- DropTable
DROP TABLE "customer_cart";

-- DropTable
DROP TABLE "doctor_details";

-- DropTable
DROP TABLE "doctor_feedback";

-- DropTable
DROP TABLE "doctor_hospital";

-- DropTable
DROP TABLE "doctor_interacteduser";

-- DropTable
DROP TABLE "doctor_remarks";

-- DropTable
DROP TABLE "doctor_searchdata";

-- DropTable
DROP TABLE "home_services";

-- DropTable
DROP TABLE "hospital_feedback";

-- DropTable
DROP TABLE "hospital_interacteduser";

-- DropTable
DROP TABLE "hospital_searchdata";

-- DropTable
DROP TABLE "lab_details";

-- DropTable
DROP TABLE "lab_feedback";

-- DropTable
DROP TABLE "lab_interacteduser";

-- DropTable
DROP TABLE "lab_searchdata";

-- DropTable
DROP TABLE "offer_data";

-- DropTable
DROP TABLE "pharmacy_details";

-- DropTable
DROP TABLE "pincode_data";

-- DropTable
DROP TABLE "productcategory";

-- DropTable
DROP TABLE "query_data";

-- DropTable
DROP TABLE "quotation";

-- DropTable
DROP TABLE "sales_invoice";

-- DropTable
DROP TABLE "sales_list";

-- DropTable
DROP TABLE "sales_order";

-- DropTable
DROP TABLE "second_opinion_data";

-- DropTable
DROP TABLE "specialization_data";

-- DropTable
DROP TABLE "type_notification";
