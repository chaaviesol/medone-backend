-- AlterTable
ALTER TABLE "hospital_details" ADD COLUMN     "featured_partner" BOOLEAN;

-- AlterTable
ALTER TABLE "sales_list" ADD COLUMN     "net_amount" INTEGER;

-- AlterTable
ALTER TABLE "sales_order" ADD COLUMN     "pincode" INTEGER;

-- AlterTable
ALTER TABLE "user_details" ADD COLUMN     "photo" JSONB;
