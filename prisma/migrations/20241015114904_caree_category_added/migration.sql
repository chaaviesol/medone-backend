-- CreateTable
CREATE TABLE "career_category" (
    "id" SERIAL NOT NULL,
    "type" TEXT,
    "department" TEXT,
    "speciality" JSONB,
    "created_date" TIMESTAMP(3),
    "modified_date" TIMESTAMP(3),

    CONSTRAINT "career_category_pkey" PRIMARY KEY ("id")
);
