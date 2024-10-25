-- AlterTable
ALTER TABLE "doctor_interacteduser" ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "hospital_interacteduser" ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "lab_interacteduser" ADD COLUMN     "status" TEXT;

-- CreateTable
CREATE TABLE "CategoryManager" (
    "id" SERIAL NOT NULL,
    "main_type" JSONB NOT NULL,
    "type" TEXT,
    "department" TEXT,
    "services" JSONB,
    "features" JSONB,
    "created_date" TIMESTAMP(3),
    "modified_date" TIMESTAMP(3),

    CONSTRAINT "CategoryManager_pkey" PRIMARY KEY ("id")
);
