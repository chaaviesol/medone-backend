/*
  Warnings:

  - Made the column `created_date` on table `chat_data` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "chat_data" ADD COLUMN     "type" TEXT,
ALTER COLUMN "created_date" SET NOT NULL;
