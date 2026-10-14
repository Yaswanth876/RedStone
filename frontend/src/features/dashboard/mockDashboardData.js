/**
 * Mock Data for Module 0 Frontend Foundation Preview.
 *
 * NOTE: This mock data is strictly temporary for previewing the visual design
 * and component layout. It will be replaced by real API data in Module 2.
 */

export const MOCK_USER = {
  name: 'Alex Morgan',
  role: 'Undergraduate Student',
  term: 'Fall 2026',
  program: 'B.Sc. Computer Science',
};

export const MOCK_SUMMARY_STATS = [
  {
    id: 'active_timetable',
    title: 'Active Timetable',
    value: 'Semester 5 (Rev. B)',
    helper: 'Uploaded 3 days ago',
    badgeText: 'Active',
    badgeVariant: 'success',
  },
  {
    id: 'classes_today',
    title: "Today's Lectures",
    value: '4 Classes',
    helper: '2 completed, 2 remaining',
    badgeText: 'On Track',
    badgeVariant: 'primary',
  },
  {
    id: 'weekly_hours',
    title: 'Weekly Load',
    value: '22 Hours',
    helper: '5 lab hours included',
    badgeText: 'Standard',
    badgeVariant: 'neutral',
  },
  {
    id: 'enrolled_courses',
    title: 'Enrolled Courses',
    value: '6 Courses',
    helper: 'All schedules resolved',
    badgeText: 'Full-time',
    badgeVariant: 'info',
  },
];

export const MOCK_NEXT_CLASS = {
  code: 'CS 301',
  name: 'Database Management Systems',
  instructor: 'Dr. Evelyn Reed',
  time: '11:15 AM – 12:45 PM',
  location: 'Hall B, Engineering Block 4',
  startsIn: 'Starting in 35 mins',
  tag: 'Core Lecture',
};

export const MOCK_TODAY_SCHEDULE = [
  {
    id: 't1',
    code: 'MATH 204',
    name: 'Discrete Mathematics',
    time: '08:30 AM – 10:00 AM',
    location: 'Room 201',
    status: 'Completed',
    statusVariant: 'neutral',
  },
  {
    id: 't2',
    code: 'CS 305',
    name: 'Operating Systems Lab',
    time: '10:00 AM – 11:00 AM',
    location: 'Computing Lab 3',
    status: 'Completed',
    statusVariant: 'neutral',
  },
  {
    id: 't3',
    code: 'CS 301',
    name: 'Database Management Systems',
    time: '11:15 AM – 12:45 PM',
    location: 'Hall B',
    status: 'Up Next',
    statusVariant: 'primary',
  },
  {
    id: 't4',
    code: 'HUM 102',
    name: 'Technical Writing & Ethics',
    time: '02:00 PM – 03:30 PM',
    location: 'Seminar Room 1',
    status: 'Upcoming',
    statusVariant: 'info',
  },
];

export const MOCK_WEEKLY_SCHEDULE = [
  {
    day: 'Mon',
    fullName: 'Monday',
    slots: [
      { time: '09:00', title: 'MATH 204', type: 'Lecture' },
      { time: '11:15', title: 'CS 301', type: 'Lecture' },
      { time: '14:00', title: 'HUM 102', type: 'Discussion' },
    ],
  },
  {
    day: 'Tue',
    fullName: 'Tuesday',
    isCurrent: true,
    slots: [
      { time: '08:30', title: 'MATH 204', type: 'Lecture' },
      { time: '10:00', title: 'CS 305 (Lab)', type: 'Lab' },
      { time: '11:15', title: 'CS 301', type: 'Lecture' },
      { time: '14:00', title: 'HUM 102', type: 'Lecture' },
    ],
  },
  {
    day: 'Wed',
    fullName: 'Wednesday',
    slots: [
      { time: '09:00', title: 'CS 308', type: 'Algorithms' },
      { time: '11:00', title: 'CS 301 (Tutorial)', type: 'Tutorial' },
      { time: '15:00', title: 'Elective I', type: 'Seminar' },
    ],
  },
  {
    day: 'Thu',
    fullName: 'Thursday',
    slots: [
      { time: '10:00', title: 'CS 305', type: 'Lecture' },
      { time: '13:30', title: 'CS 301 (Lab)', type: 'Lab' },
    ],
  },
  {
    day: 'Fri',
    fullName: 'Friday',
    slots: [
      { time: '09:30', title: 'CS 308', type: 'Algorithms' },
      { time: '11:30', title: 'Weekly Colloquium', type: 'Seminar' },
    ],
  },
];
