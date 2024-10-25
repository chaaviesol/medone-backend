-- AlterTable
ALTER TABLE "doctor_details" ADD COLUMN     "last_active" TIMESTAMP(3),
ADD COLUMN     "updatedDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "hospital_details" ADD COLUMN     "updatedDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_details" ADD COLUMN     "ageGroup" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "updatedDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "doctor_feedback" (
    "id" SERIAL NOT NULL,
    "doctor_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "message" TEXT,
    "rating" INTEGER,
    "status" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL,
    "modified_date" TIMESTAMP(3),

    CONSTRAINT "doctor_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_feedback" (
    "id" SERIAL NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "message" TEXT,
    "rating" INTEGER,
    "status" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL,
    "modified_date" TIMESTAMP(3),

    CONSTRAINT "hospital_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_feedback" (
    "id" SERIAL NOT NULL,
    "lab_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "message" TEXT,
    "rating" INTEGER,
    "status" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL,
    "modified_date" TIMESTAMP(3),

    CONSTRAINT "lab_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_searchdata" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT,
    "speciality" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_searchdata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_searchdata" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT,
    "speciality" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospital_searchdata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_searchdata" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT,
    "speciality" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_searchdata_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "doctor_feedback" ADD CONSTRAINT "doctor_feedback_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_feedback" ADD CONSTRAINT "doctor_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_feedback" ADD CONSTRAINT "hospital_feedback_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospital_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_feedback" ADD CONSTRAINT "hospital_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_feedback" ADD CONSTRAINT "lab_feedback_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "lab_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_feedback" ADD CONSTRAINT "lab_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_searchdata" ADD CONSTRAINT "doctor_searchdata_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_searchdata" ADD CONSTRAINT "hospital_searchdata_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_searchdata" ADD CONSTRAINT "lab_searchdata_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
