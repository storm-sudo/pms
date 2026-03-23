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
  const { isLoggedIn } = useApp();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (!isLoggedIn && !isAuthPage) {
      router.push('/login');
    }
  }, [isLoggedIn, isAuthPage, router]);

  // Auth pages (login, register) render without sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Prevent layout flash while redirecting to login
  if (!isLoggedIn) {
    return null;
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
