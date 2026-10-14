import {
  LayoutDashboard,
  Calendar,
  UploadCloud,
  Settings,
} from 'lucide-react';

export const navigationItems = [
  {
    name: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'My Timetable',
    to: '/timetable',
    icon: Calendar,
  },
  {
    name: 'Import Timetable',
    to: '/import',
    icon: UploadCloud,
  },
  {
    name: 'Settings',
    to: '/settings',
    icon: Settings,
  },
];
