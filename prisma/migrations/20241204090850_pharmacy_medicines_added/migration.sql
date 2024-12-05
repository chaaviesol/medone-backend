-- CreateTable
CREATE TABLE "pharmacy_medicines" (
    "id" SERIAL NOT NULL,
    "pharmacy_id" INTEGER,
    "product_ids" JSONB,
    "created_date" TIMESTAMP(3),
    "updated_date" TIMESTAMP(3),

    CONSTRAINT "pharmacy_medicines_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pharmacy_medicines" ADD CONSTRAINT "pharmacy_medicines_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacy_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;
