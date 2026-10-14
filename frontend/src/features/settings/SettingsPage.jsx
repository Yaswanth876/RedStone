import { Link } from 'react-router-dom';
import {
  Calendar,
  UploadCloud,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAuth } from '../auth/useAuth';
import { ProfileSection } from './ProfileSection.jsx';
import { PreferencesSection } from './PreferencesSection.jsx';
import { SecuritySection } from './SecuritySection.jsx';

/**
 * SettingsPage — Student settings and account management module.
 * Organized into distinct Profile, Preferences, and Security sections.
 */
export function SettingsPage() {
  useDocumentTitle('Settings & Preferences');
  const { user } = useAuth();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Settings & Preferences"
        description="Manage your student account details, display format preferences, and session security."
        badge={
          <Badge variant="primary" size="sm">
            Student Preferences
          </Badge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left 2 Columns: Profile, Preferences, and Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Authenticated Profile Information */}
          <ProfileSection user={user} />

          {/* Section 2: Display & Time Preferences */}
          <PreferencesSection />

          {/* Section 3: Security & Session Management */}
          <SecuritySection />
        </div>

        {/* Right 1 Column: System Information & Shortcuts */}
        <div className="space-y-6">
          {/* System & Architecture Info Card */}
          <Card className="bg-[#FAF9F6]">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm">RedStone Academic Suite</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs text-foreground-muted pt-4">
              <p>
                RedStone provides automated schedule ingestion, conflict detection, and weekly routine tracking for college students.
              </p>

              <div className="pt-3 border-t border-border/70 space-y-2 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Standard Timezone</span>
                  <span className="text-foreground-muted">Asia/Kolkata</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Auth Strategy</span>
                  <span className="text-foreground-muted">JWT Bearer (7-day)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Storage Model</span>
                  <span className="text-foreground-muted">Tab-scoped Session</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Client Version</span>
                  <span className="font-semibold text-foreground">0.1.0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Academic Navigation Shortcuts */}
          <Card className="bg-[#FAF9F6]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Academic Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Link
                to="/dashboard"
                className="flex items-center justify-between p-2.5 rounded-control bg-surface border border-border hover:border-primary/40 text-xs font-medium text-foreground transition-colors"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-primary" />
                  <span>Student Dashboard</span>
                </div>
                <span className="text-foreground-muted text-[11px]">→</span>
              </Link>

              <Link
                to="/timetable"
                className="flex items-center justify-between p-2.5 rounded-control bg-surface border border-border hover:border-primary/40 text-xs font-medium text-foreground transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Weekly Timetable</span>
                </div>
                <span className="text-foreground-muted text-[11px]">→</span>
              </Link>

              <Link
                to="/import"
                className="flex items-center justify-between p-2.5 rounded-control bg-surface border border-border hover:border-primary/40 text-xs font-medium text-foreground transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-primary" />
                  <span>Import Schedule File</span>
                </div>
                <span className="text-foreground-muted text-[11px]">→</span>
              </Link>
            </CardContent>
          </Card>

          {/* Privacy & Safety Note */}
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-1.5 text-xs text-foreground-muted">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Student Data Privacy</span>
              </div>
              <p className="text-[11px]">
                Your schedule data belongs exclusively to you. Class routines and documents are protected under strict user-ownership isolation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
