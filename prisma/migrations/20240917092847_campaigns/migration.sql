-- AlterTable
ALTER TABLE "doctor_remarks" ADD COLUMN     "created_date" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "coupon_code" TEXT,
    "product_id" JSONB,
    "discount_type" TEXT,
    "discount" INTEGER,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "image" TEXT,
    "status" TEXT,
    "created_date" TIMESTAMP(3),
    "created_by" INTEGER,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupon_code" ON "campaigns"("coupon_code");
