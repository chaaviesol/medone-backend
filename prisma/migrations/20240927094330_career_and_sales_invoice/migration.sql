-- CreateTable
CREATE TABLE "sales_invoice" (
    "id" SERIAL NOT NULL,
    "sales_id" INTEGER,
    "invoice_no" TEXT,
    "created_date" TIMESTAMP(3),
    "sold_by" TEXT,
    "medication_details" TEXT,

    CONSTRAINT "sales_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "department" TEXT,
    "experience" TEXT,
    "qualification" TEXT,
    "preferred_location" TEXT,
    "phone_no" TEXT,
    "type" TEXT,
    "status" TEXT,
    "created_date" TIMESTAMP(3),

    CONSTRAINT "career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_services" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "department" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "address" TEXT,
    "pincode" TEXT,
    "phone_no" TEXT,
    "type" TEXT,
    "status" TEXT,
    "created_date" TIMESTAMP(3),

    CONSTRAINT "home_services_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sales_invoice" ADD CONSTRAINT "sales_invoice_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "sales_order"("sales_id") ON DELETE SET NULL ON UPDATE CASCADE;
