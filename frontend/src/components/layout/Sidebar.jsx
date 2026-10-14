import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { navigationItems } from './navConfig';
import { useAuth } from '../../features/auth/useAuth.js';

export function SidebarLogo({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-subtle shrink-0">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 2L3 7L12 12L21 7L12 2Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M3 12L12 17L21 12"
            stroke="#F8E5E3"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 17L12 22L21 17"
            stroke="#F8E5E3"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-base font-bold tracking-tight text-foreground leading-tight">
          Red<span className="text-primary">Stone</span>
        </span>
        <span className="text-[11px] font-medium tracking-wide text-foreground-muted uppercase">
          Academic Routine
        </span>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside
      className="hidden md:flex md:flex-col w-[248px] shrink-0 min-h-screen bg-surface border-r border-border select-none"
      aria-label="Sidebar Navigation"
    >
      {/* Brand header */}
      <div className="h-16 px-5 flex items-center border-b border-border/80">
        <SidebarLogo />
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1.5" aria-label="Main menu">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-control text-sm font-medium transition-colors duration-150 group ${
                  isActive
                    ? 'bg-primary-soft text-primary font-semibold shadow-none'
                    : 'text-foreground hover:bg-[#F2EFEA] hover:text-foreground active:bg-[#ECE8E1]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                      isActive
                        ? 'text-primary'
                        : 'text-foreground-muted group-hover:text-foreground'
                    }`}
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom user / profile & session section */}
      <div className="p-3 border-t border-border/80 bg-surface">
        <div className="flex items-center gap-3 p-2.5 rounded-control hover:bg-[#F6F4F0] transition-colors duration-150">
          <div className="w-9 h-9 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold text-sm border border-primary/20 shrink-0 uppercase">
            {user?.name ? user.name.charAt(0) : <User className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {user?.name || 'Student'}
            </p>
            <p className="text-[11px] text-foreground-muted truncate">
              {user?.email || ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex items-center gap-2.5 w-full px-3 py-2 rounded-control text-xs font-medium text-foreground-muted hover:text-error hover:bg-[#FEE4E2]/50 transition-colors duration-150"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
