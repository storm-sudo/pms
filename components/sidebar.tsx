'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  GanttChart,
  Plus,
  Moon,
  Sun,
  ChevronDown,
  Dna,
  Settings,
  Search,
  Keyboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp, useIsAdmin, useProjects, useTasks } from '@/lib/store';
import { allUsers } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect, useCallback } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'My Tasks', href: '/tasks', icon: ListTodo },
  { name: 'Timeline', href: '/timeline', icon: GanttChart },
];

const adminNavigation = [
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, currentUser, setCurrentUser, logout, setSelectedTaskId, addTask } = useApp();
  const isAdmin = useIsAdmin();
  const projects = useProjects();
  const tasks = useTasks();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskProjectId, setQuickTaskProjectId] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Quick Add: actually create the task
  const handleQuickAddTask = useCallback(() => {
    if (!quickTaskTitle.trim()) return;
    const projectId = quickTaskProjectId || projects[0]?.id;
    if (!projectId) return;
    addTask({
      title: quickTaskTitle.trim(),
      projectId,
      priority: 'medium',
      status: 'todo',
      subtasks: [],
      comments: [],
      tags: [],
      order: tasks.filter(t => t.projectId === projectId).length,
    });
    setQuickAddOpen(false);
    setQuickTaskTitle('');
    setQuickTaskProjectId('');
  }, [quickTaskTitle, quickTaskProjectId, projects, tasks, addTask]);

  // Search results
  const searchResults = searchQuery.trim().length > 0 ? {
    tasks: tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5),
    projects: projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3),
    users: allUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3),
  } : { tasks: [], projects: [], users: [] };

  const hasResults = searchResults.tasks.length > 0 || searchResults.projects.length > 0 || searchResults.users.length > 0;

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Ctrl+K / Cmd+K — open search (works even in inputs)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
        return;
      }

      // Don't trigger single-key shortcuts when typing in inputs
      if (isInputFocused) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setQuickAddOpen(true);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar glass flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Dna className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-semibold text-sidebar-foreground">Synapse</h1>
          <p className="text-xs text-muted-foreground">NucleoVir Therapeutics</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-sidebar-border">
        <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full justify-start gap-2" size="sm">
              <Plus className="h-4 w-4" />
              Quick Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quick Add Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Enter task title..."
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAddTask()}
                autoFocus
              />
              <Select value={quickTaskProjectId || projects[0]?.id || ''} onValueChange={setQuickTaskProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setQuickAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleQuickAddTask} disabled={!quickTaskTitle.trim()}>
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-sidebar-border">
        <Dialog open={searchOpen} onOpenChange={(open) => { setSearchOpen(open); if (!open) setSearchQuery(''); }}>
          <DialogTrigger asChild>
            <button className="relative w-full">
              <div className="flex items-center h-9 w-full rounded-md border border-input bg-sidebar-accent/50 px-3 py-1 text-sm cursor-pointer hover:bg-sidebar-accent transition-colors">
                <Search className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-muted-foreground">Search...</span>
                <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md p-0">
            <div className="p-4 pb-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tasks, projects, people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto p-4 pt-2">
              {searchQuery.trim() && !hasResults && (
                <p className="text-sm text-muted-foreground text-center py-8">No results found</p>
              )}
              {searchResults.projects.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Projects</p>
                  {searchResults.projects.map((p) => (
                    <button
                      key={p.id}
                      className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted text-left text-sm transition-colors"
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); router.push('/projects'); }}
                    >
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              {searchResults.tasks.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tasks</p>
                  {searchResults.tasks.map((t) => (
                    <button
                      key={t.id}
                      className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted text-left text-sm transition-colors"
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); setSelectedTaskId(t.id); }}
                    >
                      <ListTodo className="h-4 w-4 text-muted-foreground" />
                      {t.title}
                    </button>
                  ))}
                </div>
              )}
              {searchResults.users.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">People</p>
                  {searchResults.users.map((u) => (
                    <button
                      key={u.id}
                      className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted text-left text-sm transition-colors"
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); router.push('/team'); }}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">{getInitials(u.name)}</AvatarFallback>
                      </Avatar>
                      {u.name}
                    </button>
                  ))}
                </div>
              )}
              {!searchQuery.trim() && (
                <p className="text-sm text-muted-foreground text-center py-8">Start typing to search...</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Workspace
        </p>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <p className="px-3 py-2 pt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Administration
            </p>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}

        {/* Keyboard Shortcuts */}
        <p className="px-3 py-2 pt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Access
        </p>
        <div className="space-y-1 px-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between py-1">
            <span>New Task</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">N</kbd>
          </div>
          <div className="flex items-center justify-between py-1">
            <span>Search</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </div>
          <div className="flex items-center justify-between py-1">
            <span>Toggle Theme</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">T</kbd>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              Dark Mode
            </>
          )}
        </Button>

        {/* User Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentUser.role === 'admin' ? 'Admin' : currentUser.department}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Switch User (Demo)</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allUsers.slice(0, 8).map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => setCurrentUser(user)}
                className={cn(currentUser.id === user.id && 'bg-accent')}
              >
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarFallback className="text-[10px]">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.role === 'admin' ? 'Admin' : user.department}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
