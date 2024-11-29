-- CreateTable
CREATE TABLE "remainder" (
    "id" SERIAL NOT NULL,
    "quotes" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remainder_pkey" PRIMARY KEY ("id")
);
