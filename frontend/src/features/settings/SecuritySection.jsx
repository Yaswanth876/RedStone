import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, CheckCircle2, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../auth/useAuth';
import { LogoutConfirmDialog } from './LogoutConfirmDialog.jsx';

/**
 * SecuritySection — presents active session status, security policy, and logout actions.
 */
export function SecuritySection() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const handleConfirmLogout = () => {
    setIsLogoutOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      <Card>
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle className="text-base">Security &amp; Session Management</CardTitle>
          <CardDescription className="text-xs">
            Review active session credentials and authentication security details.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Active Session Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-control bg-[#FAF9F6] border border-border">
            <div className="flex items-center gap-3">
              <KeyRound className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Active Session
                </p>
                <p className="text-[11px] text-foreground-muted">
                  Tab-scoped JWT authentication via Bearer token
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Authenticated
              </Badge>
            </div>
          </div>

          {/* Password Notice */}
          <div className="p-3.5 rounded-control bg-[#FAF9F6] border border-border text-xs text-foreground-muted flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-foreground-muted shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Password &amp; Credential Changes</p>
              <p>
                Self-service password modification is not currently supported by the backend API. Passwords remain salted and hashed server-side using bcrypt. Password change and reset features will be introduced in a future security release.
              </p>
            </div>
          </div>

          {/* Session Termination (Logout) */}
          <div className="pt-4 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-foreground">
                End Active Session
              </h4>
              <p className="text-[11px] text-foreground-muted">
                Clears your current authentication token from browser storage and returns to the sign-in screen.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsLogoutOpen(true)}
              leftIcon={LogOut}
              className="text-error hover:bg-[#FEE4E2]/40 hover:border-[#FECDCA]"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}

export default SecuritySection;
