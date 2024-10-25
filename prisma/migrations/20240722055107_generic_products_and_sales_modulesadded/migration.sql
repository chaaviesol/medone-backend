-- CreateTable
CREATE TABLE "generic_product" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "created_by" TEXT,
    "created_date" TIMESTAMP(3),
    "is_active" TEXT,
    "updated_by" TEXT,
    "updated_date" TIMESTAMP(3),
    "images" JSONB,
    "mrp" INTEGER,

    CONSTRAINT "generic_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_cart" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "prod_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "customer_cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_list" (
    "id" SERIAL NOT NULL,
    "sales_id" INTEGER,
    "product_id" INTEGER,
    "order_qty" INTEGER,
    "pharmacy_name" TEXT,
    "created_by" TEXT,
    "created_date" TIMESTAMP(3),
    "modified_by" TEXT,
    "modified_date" TIMESTAMP(3),

    CONSTRAINT "sales_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order" (
    "sales_id" SERIAL NOT NULL,
    "so_number" TEXT,
    "total_amount" DECIMAL(65,30),
    "so_status" TEXT,
    "order_type" TEXT,
    "prescription_image" JSONB,
    "remarks" TEXT,
    "delivery_date" TIMESTAMP(3),
    "created_by" TEXT,
    "created_date" TIMESTAMP(3),
    "updated_by" TEXT,
    "updated_date" TIMESTAMP(3),
    "user_id" INTEGER,

    CONSTRAINT "sales_order_pkey" PRIMARY KEY ("sales_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "so_number" ON "sales_order"("so_number");

-- AddForeignKey
ALTER TABLE "customer_cart" ADD CONSTRAINT "customer_cart_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_cart" ADD CONSTRAINT "customer_cart_prod_id_fkey" FOREIGN KEY ("prod_id") REFERENCES "generic_product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_list" ADD CONSTRAINT "sales_list_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "sales_order"("sales_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_list" ADD CONSTRAINT "sales_list_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "generic_product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order" ADD CONSTRAINT "sales_order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;
