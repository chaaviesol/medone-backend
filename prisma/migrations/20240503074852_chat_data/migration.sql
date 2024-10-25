-- CreateTable
CREATE TABLE "chat_data" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "contact_no" TEXT,
    "created_date" TIMESTAMP(3),

    CONSTRAINT "chat_data_pkey" PRIMARY KEY ("id")
);
