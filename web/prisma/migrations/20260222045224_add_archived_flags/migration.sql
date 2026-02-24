-- AlterTable
ALTER TABLE "Move" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Style" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Substyle" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;
