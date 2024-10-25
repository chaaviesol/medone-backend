-- CreateTable
CREATE TABLE "admin_details" (
    "id" SERIAL NOT NULL,
    "adm_id" TEXT,
    "adm_type" TEXT,
    "name" TEXT,
    "emailid" TEXT,
    "phone_no" TEXT,
    "password" TEXT,
    "is_active" TEXT,
    "created_date" TIMESTAMP(3),
    "created_by" TEXT,
    "modified_date" TIMESTAMP(3),

    CONSTRAINT "admin_details_pkey" PRIMARY KEY ("id")
);
