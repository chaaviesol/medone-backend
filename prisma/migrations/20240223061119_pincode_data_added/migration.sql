-- CreateTable
CREATE TABLE "pincode_data" (
    "id" SERIAL NOT NULL,
    "state" TEXT,
    "pincode" INTEGER,
    "district" TEXT,
    "postname" TEXT,

    CONSTRAINT "pincode_data_pkey" PRIMARY KEY ("id")
);
