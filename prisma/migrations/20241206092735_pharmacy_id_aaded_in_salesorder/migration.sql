-- AlterTable
ALTER TABLE "sales_order" ADD COLUMN     "pharmacy_id" INTEGER;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacy_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;
