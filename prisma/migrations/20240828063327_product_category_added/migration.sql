-- CreateTable
CREATE TABLE "productcategory" (
    "id" SERIAL NOT NULL,
    "category" TEXT,
    "subcategory" TEXT,
    "image" TEXT,
    "created_date" TIMESTAMP(3),
    "created_by" INTEGER,
    "modified_date" TIMESTAMP(3),

    CONSTRAINT "productcategory_pkey" PRIMARY KEY ("id")
);
