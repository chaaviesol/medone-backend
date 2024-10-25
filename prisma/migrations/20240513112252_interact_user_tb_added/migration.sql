/*
  Warnings:

  - You are about to drop the `intracted_user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "intracted_user" DROP CONSTRAINT "intracted_user_user_id_fkey";

-- DropTable
DROP TABLE "intracted_user";

-- CreateTable
CREATE TABLE "lab_interacteduser" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "lab_id" INTEGER NOT NULL,
    "viewcount" INTEGER,
    "consultcount" INTEGER,
    "created_date" TIMESTAMP(3),

    CONSTRAINT "lab_interacteduser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_interacteduser" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "doctor_id" INTEGER NOT NULL,
    "viewcount" INTEGER,
    "consultcount" INTEGER,
    "created_date" TIMESTAMP(3),

    CONSTRAINT "doctor_interacteduser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_interacteduser" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "viewcount" INTEGER,
    "consultcount" INTEGER,
    "created_date" TIMESTAMP(3),

    CONSTRAINT "hospital_interacteduser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_data" (
    "id" SERIAL NOT NULL,
    "lab_id" INTEGER NOT NULL,
    "offer_name" TEXT,
    "offer_code" TEXT,
    "discount_type" TEXT,
    "discount" INTEGER,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "text" TEXT,
    "status" TEXT,
    "created_date" TIMESTAMP(3),
    "created_by" INTEGER,

    CONSTRAINT "offer_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offer_data_offer_code_key" ON "offer_data"("offer_code");

-- AddForeignKey
ALTER TABLE "lab_interacteduser" ADD CONSTRAINT "lab_interacteduser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_interacteduser" ADD CONSTRAINT "lab_interacteduser_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "lab_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_interacteduser" ADD CONSTRAINT "doctor_interacteduser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_interacteduser" ADD CONSTRAINT "doctor_interacteduser_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_interacteduser" ADD CONSTRAINT "hospital_interacteduser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_interacteduser" ADD CONSTRAINT "hospital_interacteduser_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospital_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_data" ADD CONSTRAINT "offer_data_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "lab_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
