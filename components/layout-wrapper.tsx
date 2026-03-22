'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { TaskDetailPanel } from '@/components/task-detail-panel';
import { ProjectNotesPanel } from '@/components/project-notes-panel';
import { UserProfilePanel } from '@/components/user-profile-panel';
import { useApp } from '@/lib/store';
import { useEffect } from 'react';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn } = useApp();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoggedIn && !isLoginPage) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isLoggedIn) {
    return null; // prevent layout flash while redirecting
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
    </div>
  );
}
