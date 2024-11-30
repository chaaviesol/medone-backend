-- AlterTable
ALTER TABLE "generic_product" ADD COLUMN     "composition" JSONB,
ADD COLUMN     "generic_name" TEXT,
ADD COLUMN     "hsn" TEXT,
ADD COLUMN     "product_type" TEXT;

-- AlterTable
ALTER TABLE "medicine_timetable" ADD COLUMN     "sales_invoiceid" INTEGER;

-- CreateTable
CREATE TABLE "customer_cart" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "prod_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_date" TIMESTAMP(3),

    CONSTRAINT "customer_cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productcategory" (
    "id" SERIAL NOT NULL,
    "category" TEXT,
    "image" TEXT,
    "status" BOOLEAN,
    "created_date" TIMESTAMP(3),
    "created_by" INTEGER,
    "modified_date" TIMESTAMP(3),

    CONSTRAINT "productcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order" (
    "sales_id" SERIAL NOT NULL,
    "so_number" TEXT,
    "total_amount" DECIMAL(10,2),
    "so_status" TEXT,
    "order_type" TEXT,
    "remarks" TEXT,
    "delivery_address" TEXT,
    "district" TEXT,
    "city" TEXT,
    "delivery_date" TIMESTAMP(3),
    "created_date" TIMESTAMP(3),
    "updated_by" INTEGER,
    "updated_date" TIMESTAMP(3),
    "contact_no" TEXT,
    "customer_id" INTEGER,
    "pincode" INTEGER,
    "prescription_image" JSONB,
    "patient_name" TEXT,
    "doctor_name" TEXT,

    CONSTRAINT "sales_order_pkey" PRIMARY KEY ("sales_id")
);

-- CreateTable
CREATE TABLE "sales_invoice" (
    "id" SERIAL NOT NULL,
    "sales_id" INTEGER,
    "created_date" TIMESTAMP(3),
    "sold_by" TEXT,

    CONSTRAINT "sales_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_list" (
    "id" SERIAL NOT NULL,
    "sales_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "order_qty" INTEGER,
    "net_amount" INTEGER,
    "selling_price" INTEGER,
    "batch_no" TEXT,
    "pharmacy_name" TEXT,
    "created_date" TIMESTAMP(3),

    CONSTRAINT "sales_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_details" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "phone_no" TEXT,
    "address" TEXT,
    "lisence_no" TEXT,
    "datetime" TIMESTAMP(3) NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "pincode" INTEGER,
    "created_by" INTEGER,

    CONSTRAINT "pharmacy_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "so_number" ON "sales_order"("so_number");

-- AddForeignKey
ALTER TABLE "customer_cart" ADD CONSTRAINT "customer_cart_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_cart" ADD CONSTRAINT "customer_cart_prod_id_fkey" FOREIGN KEY ("prod_id") REFERENCES "generic_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "user_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice" ADD CONSTRAINT "sales_invoice_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "sales_order"("sales_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_list" ADD CONSTRAINT "sales_list_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "sales_order"("sales_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_list" ADD CONSTRAINT "sales_list_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "generic_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_timetable" ADD CONSTRAINT "medicine_timetable_sales_invoiceid_fkey" FOREIGN KEY ("sales_invoiceid") REFERENCES "sales_invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
