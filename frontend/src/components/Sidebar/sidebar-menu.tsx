'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial state

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const isRouteActive = (path: string) => {
    return pathname?.startsWith(path);
  };
  // Define routes that should NOT show the sidebar
  const noSidebarRoutes = ['/user-onboarding', '/signin', '/auth', '/callback'];

  // Check if current path matches or starts with any of the routes that shouldn't have a sidebar
  const shouldHideSidebar = noSidebarRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  return (
    <div
      className={clsx(
        'flex h-screen border-r border-custom-border-200 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-60',
        isCollapsed ? 'md:relative fixed' : 'md:relative fixed',
        'bg-background z-50' // Make sidebar fixed on small screens
      )}
    >
      {isCollapsed ? (
        <div className="flex items-center justify-center h-full">
          <Button variant="ghost" onClick={toggleSidebar}>
            <ArrowRight size={20} />
          </Button>
        </div>
      ) : (
        <div className="pt-4 flex flex-col w-full">
          {/* Sidebar content */}
          <div className="px-4 flex flex-col gap-y-4 border-b border-custom-border-200 pb-3">
            <div className="flex items-center justify-center gap-x-3 gap-y-2">
              <div className="relative h-full truncate text-left flex-grow flex justify-stretch">
                <Link href="/">
                  <Image
                    src="https://iili.io/3Iq7FZQ.png"
                    alt="logo"
                    className="w-20"
                    width={40}
                    height={40}
                  />
                </Link>
              </div>
            </div>
          </div>
          <div className="h-4"></div>
          <div className="overflow-x-hidden scrollbar-sm h-full w-full overflow-y-auto py-0.5 vertical-scrollbar">
            <Link href="/scans">
              <Button
                variant="ghost"
                className={clsx(
                  'flex items-center gap-x-2 w-full justify-start h-8 text-sm',
                  isRouteActive('/scans') && 'bg-border text-accent-foreground'
                )}
              >
                <Clock size={16} />
                <p
                  className={clsx(
                    'text-sm',
                    isRouteActive('/scans')
                      ? 'text-accent-foreground'
                      : 'text-gray-200'
                  )}
                >
                  Scans
                </p>
              </Button>
            </Link>
          </div>

          <div className="flex w-full items-center justify-between px-2 self-baseline border-t border-custom-border-200 bg-custom-sidebar-background-100 h-12 flex-shrink-0">
            <div className="flex flex-shrink-0 items-center gap-1 justify-evenly">
              <Button
                variant="ghost"
                className="px-2 h-8"
                onClick={toggleSidebar}
              >
                {isCollapsed ? (
                  <ArrowRight size={20} />
                ) : (
                  <ArrowLeft size={20} />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
