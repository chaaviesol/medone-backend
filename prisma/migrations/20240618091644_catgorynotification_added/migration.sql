-- AlterTable
ALTER TABLE "hospital_details" ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "lab_details" ALTER COLUMN "status" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "adm_notification" (
    "id" SERIAL NOT NULL,
    "text" TEXT,
    "sender" INTEGER,
    "read" TEXT,
    "type" TEXT,
    "created_date" TIMESTAMP(3),
    "modified_by" INTEGER,
    "modified_date" TIMESTAMP(3),

    CONSTRAINT "adm_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "type_notification" (
    "id" SERIAL NOT NULL,
    "category" TEXT,
    "text" TEXT,
    "receiver_id" INTEGER,
    "read" TEXT,
    "type" TEXT,
    "created_date" TIMESTAMP(3),
    "created_by" INTEGER,
    "modified_date" TIMESTAMP(3),

    CONSTRAINT "type_notification_pkey" PRIMARY KEY ("id")
);
