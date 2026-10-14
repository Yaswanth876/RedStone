-- CreateTable
CREATE TABLE "Timetable" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Timetable',
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);
