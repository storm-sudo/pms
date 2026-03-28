'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { TaskDetailPanel } from '@/components/task-detail-panel';
import { ProjectNotesPanel } from '@/components/project-notes-panel';
import { UserProfilePanel } from '@/components/user-profile-panel';
import { useApp } from '@/lib/store';
import { useEffect } from 'react';
import { ReminderChecker } from '@/components/reminder-checker';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, currentUser } = useApp();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPortalPage = pathname?.startsWith('/portal');

  useEffect(() => {
    if (!isLoggedIn && !isAuthPage) {
      router.push('/login');
      return;
    }

    // Redirect stakeholders to portal if they attempt to access internal app
    if (isLoggedIn && currentUser?.role === 'stakeholder' && !isPortalPage) {
      router.push('/portal');
    }

    // Redirect admins/leads away from portal if they are at root portal (optional)
    // if (isLoggedIn && currentUser?.role !== 'stakeholder' && isPortalPage) {
    //   router.push('/app');
    // }
  }, [isLoggedIn, isAuthPage, isPortalPage, currentUser, router]);

  // Auth pages (login, register) render without sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Prevent layout flash while redirecting to login
  if (!isLoggedIn) {
    return null;
  }

  // Portal pages have their own layout (defined in app/portal/layout.tsx)
  if (isPortalPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64">
        {children}
      </main>
      <TaskDetailPanel />
      <ProjectNotesPanel />
      <UserProfilePanel />
      <ReminderChecker />
    </div>
  );
}
