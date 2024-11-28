-- CreateTable
CREATE TABLE "user_feedback" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "medicineId" INTEGER,
    "feedback" JSONB,
    "createdDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id")
);
