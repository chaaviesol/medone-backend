-- CreateTable
CREATE TABLE "doctor_details" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "phone_no" TEXT,
    "email" TEXT,
    "password" TEXT,
    "image" JSONB,
    "education_qualification" TEXT,
    "specialization" TEXT,
    "type" TEXT,
    "gender" TEXT,
    "address" TEXT,
    "status" TEXT,
    "experince" TEXT,
    "about" TEXT,
    "rating" DOUBLE PRECISION,
    "datetime" TIMESTAMP(3) NOT NULL,
    "registration_no" TEXT,
    "featured_partner" BOOLEAN,

    CONSTRAINT "doctor_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_details" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "lisence_no" TEXT,
    "rating" DOUBLE PRECISION,
    "feature" TEXT,
    "datetime" TIMESTAMP(3) NOT NULL,
    "photo" JSONB,
    "speciality" TEXT,
    "contact_no" TEXT,
    "onlinebooking" TEXT,
    "unique_id" TEXT,

    CONSTRAINT "hospital_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_hospital" (
    "id" SERIAL NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "doctor_id" INTEGER NOT NULL,
    "timing" TEXT,
    "days" TEXT,
    "consultation_fees" TEXT,
    "datetime" TIMESTAMP(3) NOT NULL,
    "isavailable" BOOLEAN,

    CONSTRAINT "doctor_hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_details" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "phone_no" TEXT,
    "address" TEXT,
    "lisence_no" TEXT,
    "type" TEXT,
    "timing" TEXT,
    "rating" DOUBLE PRECISION,
    "datetime" TIMESTAMP(3) NOT NULL,
    "email" TEXT,
    "password" TEXT,

    CONSTRAINT "pharmacy_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_details" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "phone_no" TEXT,
    "address" TEXT,
    "timing" TEXT,
    "lisence_no" TEXT,
    "email" TEXT,
    "password" TEXT,
    "status" BOOLEAN,
    "rating" DOUBLE PRECISION,
    "datetime" TIMESTAMP(3) NOT NULL,
    "photo" JSONB,
    "about" TEXT,
    "featured_partner" BOOLEAN,

    CONSTRAINT "lab_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_details" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "phone_no" TEXT,
    "email" TEXT,
    "password" TEXT,
    "datetime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quatation" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file" JSONB NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL,
    "accepted_pharmacy" INTEGER,

    CONSTRAINT "quatation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_response_table" (
    "id" SERIAL NOT NULL,
    "pharmacy_id" INTEGER NOT NULL,
    "pharmacy_amount" TEXT,
    "status" BOOLEAN,
    "datetime" TIMESTAMP(3) NOT NULL,
    "quatation_id" INTEGER,

    CONSTRAINT "pharmacy_response_table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialization_data" (
    "id" SERIAL NOT NULL,
    "spec_name" JSONB,

    CONSTRAINT "specialization_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "service_name" JSONB,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "type_table" (
    "id" SERIAL NOT NULL,
    "type_name" TEXT,

    CONSTRAINT "type_table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intracted_user" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "data_id" INTEGER NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intracted_user_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "quatation" ADD CONSTRAINT "quatation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_response_table" ADD CONSTRAINT "pharmacy_response_table_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacy_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intracted_user" ADD CONSTRAINT "intracted_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
