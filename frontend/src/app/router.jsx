import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import TimetablePage from '../features/timetable/TimetablePage';
import ImportPage from '../features/upload/ImportPage';
import ReviewTimetablePage from '../features/upload/ReviewTimetablePage';
import SettingsPage from '../features/settings/SettingsPage';

export const router = createBrowserRouter([
  // Public auth routes — authenticated users are bounced to /dashboard
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <GuestRoute>
        <RegisterPage />
      </GuestRoute>
    ),
  },

  // Main application shell — unauthenticated users are sent to /login
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'timetable',
        element: <TimetablePage />,
      },
      {
        path: 'import',
        element: <ImportPage />,
      },
      {
        path: 'import/review',
        element: <ReviewTimetablePage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);

export default router;
