-- CreateTable
CREATE TABLE "delivery_partner" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "vehicle_id" TEXT,
    "is_active" BOOLEAN,
    "pharmacy_is" JSONB,
    "created_date" TIMESTAMP(3),

    CONSTRAINT "delivery_partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_assign" (
    "id" SERIAL NOT NULL,
    "sales_id" INTEGER,
    "deliverypartner_id" INTEGER,
    "status" TEXT,
    "assigned_date" TIMESTAMP(3),
    "picked_update" TIMESTAMP(3),
    "delivered_date" TIMESTAMP(3),

    CONSTRAINT "delivery_assign_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "delivery_assign" ADD CONSTRAINT "delivery_assign_deliverypartner_id_fkey" FOREIGN KEY ("deliverypartner_id") REFERENCES "delivery_partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_assign" ADD CONSTRAINT "delivery_assign_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "sales_order"("sales_id") ON DELETE SET NULL ON UPDATE CASCADE;
