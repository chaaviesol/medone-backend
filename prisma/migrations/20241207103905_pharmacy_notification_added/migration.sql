-- CreateTable
CREATE TABLE "pharmacy_notification" (
    "id" SERIAL NOT NULL,
    "pharmacyId" INTEGER,
    "message" TEXT,
    "view_status" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacy_notification_pkey" PRIMARY KEY ("id")
);
