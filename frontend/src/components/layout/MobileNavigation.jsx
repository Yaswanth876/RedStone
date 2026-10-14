import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User } from 'lucide-react';
import { SidebarLogo } from './Sidebar';
import { navigationItems } from './navConfig';
import { useAuth } from '../../features/auth/useAuth.js';

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close mobile navigation drawer whenever route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  function handleLogout() {
    setIsOpen(false);
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="md:hidden sticky top-0 z-40 bg-surface border-b border-border shadow-subtle">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 h-16">
        <SidebarLogo />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="p-2 rounded-control text-foreground hover:bg-[#F2EFEA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 top-16 bg-black/30 backdrop-blur-[2px] z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-down / drawer panel */}
      {isOpen && (
        <div className="fixed inset-x-0 top-16 bg-surface border-b border-border shadow-lg z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="p-4 space-y-1" aria-label="Mobile navigation menu">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-3 rounded-control text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-primary-soft text-primary font-semibold'
                        : 'text-foreground hover:bg-[#F2EFEA]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive ? 'text-primary' : 'text-foreground-muted'
                        }`}
                      />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User profile & auth links in mobile menu */}
          <div className="p-4 border-t border-border/80 bg-[#FAF9F6]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold text-sm border border-primary/20 shrink-0 uppercase">
                {user?.name ? user.name.charAt(0) : <User className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.name || 'Student'}
                </p>
                <p className="text-xs text-foreground-muted truncate">
                  {user?.email || ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-control text-xs font-medium text-foreground-muted hover:text-error hover:bg-[#FEE4E2]/40 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileNavigation;
