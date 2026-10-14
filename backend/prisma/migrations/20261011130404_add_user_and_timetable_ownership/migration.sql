/*
  Warnings:

  - Added the required column `userId` to the `Timetable` table without a default value.
  - Existing timetable rows are deleted as they have no owner (dev data only).

*/
-- CreateTable (must come first so the FK target exists)
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Delete ownerless dev rows so NOT NULL constraint can be satisfied
DELETE FROM "Timetable";

-- AlterTable
ALTER TABLE "Timetable" ADD COLUMN "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
