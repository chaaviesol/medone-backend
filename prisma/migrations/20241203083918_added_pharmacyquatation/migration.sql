-- AlterTable
ALTER TABLE "pharmacy_details" ALTER COLUMN "address" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "pharmacyquotation" (
    "id" SERIAL NOT NULL,
    "pharmacy_id" INTEGER NOT NULL,
    "sales_id" INTEGER NOT NULL,
    "status" TEXT,
    "created_date" TIMESTAMP(3),
    "Stmodified_date" TIMESTAMP(3),

    CONSTRAINT "pharmacyquotation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pharmacyquotation" ADD CONSTRAINT "pharmacyquotation_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacy_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacyquotation" ADD CONSTRAINT "pharmacyquotation_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "sales_order"("sales_id") ON DELETE RESTRICT ON UPDATE CASCADE;
