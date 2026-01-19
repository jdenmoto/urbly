import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import useBreakpoint from '@/components/useBreakpoint';

export default function AppLayout() {
  const { isDesktop, isTablet } = useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const showSidebar = isDesktop || isTablet;

  return (
    <div className="flex min-h-screen">
      {showSidebar ? <Sidebar collapsed={collapsed} /> : null}
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar onToggle={showSidebar ? () => setCollapsed((prev) => !prev) : undefined} />
        <main className="flex-1 space-y-8 px-4 py-6 pb-24 md:px-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
