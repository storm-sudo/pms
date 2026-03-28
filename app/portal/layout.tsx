"use client";

import { ReactNode } from 'react';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  LogOut, 
  LayoutDashboard, 
  FileText, 
  Bell,
  FlaskConical
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { currentUser, logout, theme, toggleTheme } = useApp();
  const pathname = usePathname();

  if (currentUser?.role !== 'stakeholder' && currentUser?.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold uppercase tracking-tighter">Access Restricted</h1>
          <p className="text-muted-foreground">This portal is reserved for project stakeholders and laboratory leadership.</p>
          <Button asChild variant="outline" className="font-bold border-2">
            <Link href="/app">RETURN TO LABORATORY</Link>
          </Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'DASHBOARD', icon: LayoutDashboard, href: '/portal' },
    { label: 'LABORATORY ARCHIVE', icon: FileText, href: '/portal/documents' },
  ];

  return (
    <div className={`min-h-screen bg-background ${theme === 'dark' ? 'dark' : ''}`}>
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <FlaskConical className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col -gap-1">
              <span className="text-xl font-bold tracking-tighter uppercase leading-none">Synapse</span>
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase opacity-80">STAKEHOLDER PORTAL</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-9 w-9 border-2 border-transparent hover:border-primary/20">
              <Bell className="h-5 w-5" />
            </Button>
            
            <div className="h-8 w-[1px] bg-border" />
            
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end mr-2">
                <span className="text-xs font-bold uppercase tracking-tight leading-none">{currentUser.name || currentUser.full_name}</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none mt-1">Authorized Stakeholder</span>
              </div>
              <Button onClick={() => logout()} variant="outline" size="icon" className="h-10 w-10 border-2 hover:bg-destructive hover:text-white transition-colors">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 border-r bg-card/50 hidden md:block h-[calc(100vh-64px)] sticky top-16">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold uppercase tracking-tight text-xs transition-all ${
                  pathname === item.href 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:bg-muted hover:text-primary border-2 border-transparent'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
