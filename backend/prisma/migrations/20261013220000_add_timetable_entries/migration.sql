-- CreateTable
CREATE TABLE "TimetableEntry" (
    "id" TEXT NOT NULL,
    "timetableId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "faculty" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimetableEntry_timetableId_dayOfWeek_startTime_idx"
ON "TimetableEntry"("timetableId", "dayOfWeek", "startTime");

-- AddForeignKey
ALTER TABLE "TimetableEntry"
ADD CONSTRAINT "TimetableEntry_timetableId_fkey"
FOREIGN KEY ("timetableId") REFERENCES "Timetable"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
