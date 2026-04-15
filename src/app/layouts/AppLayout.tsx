import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import useBreakpoint from '@/components/useBreakpoint';

export default function AppLayout() {
  const location = useLocation();
  const { isDesktop, isIpad, isMobile } = useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const showSidebar = isDesktop || isIpad;

  return (
    <div className="flex min-h-screen bg-[#eef2f6]">
      {showSidebar ? <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} /> : null}
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 py-6 pb-24 ipad:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 170, damping: 22 }}
              className="space-y-8"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <BottomNav show={isMobile} />
    </div>
  );
}
