import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-page flex flex-col md:flex-row text-foreground">
      {/* Desktop Sidebar (fixed/sticky) */}
      <div className="hidden md:block sticky top-0 h-screen shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Top Navigation */}
      <MobileNavigation />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
