import { User, Mail, Calendar, ShieldCheck, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/dateTime.js';

/**
 * ProfileSection — displays authenticated student account details.
 * Reflects actual fields provided by the backend User model (name, email, createdAt).
 * Explicitly read-only because profile update endpoints are not supported by the backend.
 *
 * @param {object} props
 * @param {object|null} props.user - Authenticated user object from AuthContext
 */
export function ProfileSection({ user }) {
  const memberSince = user?.createdAt
    ? formatDate(user.createdAt, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Active Session';

  // Get user initials for display
  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card>
      <CardHeader className="border-b border-border/70 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-subtle shrink-0">
              {initials}
            </div>
            <div>
              <CardTitle className="text-base">{user?.name || 'Student Account'}</CardTitle>
              <CardDescription className="text-xs">
                Authenticated Student Account
              </CardDescription>
            </div>
          </div>

          <Badge variant="success" size="sm">
            Active Account
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Read-Only Account Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-control bg-[#FAF9F6] border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <User className="w-3.5 h-3.5" />
              <span>Full Name</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {user?.name || 'Not provided'}
            </p>
          </div>

          <div className="p-3.5 rounded-control bg-[#FAF9F6] border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <Mail className="w-3.5 h-3.5" />
              <span>Email Address</span>
            </div>
            <p className="text-sm font-semibold text-foreground truncate" title={user?.email}>
              {user?.email || 'Not provided'}
            </p>
          </div>

          <div className="p-3.5 rounded-control bg-[#FAF9F6] border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <Calendar className="w-3.5 h-3.5" />
              <span>Account Created</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {memberSince}
            </p>
          </div>

          <div className="p-3.5 rounded-control bg-[#FAF9F6] border border-border space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Account Security</span>
            </div>
            <p className="text-sm font-semibold text-[#1E7B34]">
              Password Protected (Bcrypt)
            </p>
          </div>
        </div>

        {/* Read-Only Policy Notice */}
        <div className="p-3.5 rounded-control bg-[#FAF9F6] border border-border/80 text-xs text-foreground-muted flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-foreground-muted shrink-0 mt-0.5" />
          <p>
            Your account name and college email are established during registration and synchronized with your active session. Profile editing is not currently exposed via the backend API.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileSection;
