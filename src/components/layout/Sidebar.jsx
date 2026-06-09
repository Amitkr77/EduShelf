'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  Search,
  BookMarked,
  CalendarCheck,
  Heart,
  Bell,
  UserCircle,
  Library,
  BookPlus,
  RotateCcw,
  Users,
  Receipt,
  BarChart3,
  LogOut,
  GraduationCap,
  ChevronDown,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import apiFetch from '@/lib/fetcher';

const studentItems = [
  { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { name: 'Browse Books', href: '/student/books', icon: Search },
  { name: 'My Books', href: '/student/my-books', icon: BookMarked },
  { name: 'Reservations', href: '/student/reservations', icon: CalendarCheck },
  { name: 'Wishlist', href: '/student/wishlist', icon: Heart },
  { name: 'Notifications', href: '/student/notifications', icon: Bell },
  { name: 'Profile', href: '/student/profile', icon: UserCircle },
];

const librarianItems = [
  { name: 'Dashboard', href: '/librarian/dashboard', icon: LayoutDashboard },
  { name: 'Manage Books', href: '/librarian/books', icon: Library },
  { name: 'Issue Books', href: '/librarian/issues', icon: BookPlus },
  { name: 'Returns', href: '/librarian/returns', icon: RotateCcw },
  { name: 'Students', href: '/librarian/students', icon: Users },
  { name: 'Fines', href: '/librarian/fines', icon: Receipt },
  { name: 'Reports', href: '/librarian/reports', icon: BarChart3 },
  { name: 'Profile', href: '/librarian/profile', icon: UserCircle },
];

function SidebarContent({ items, currentPath, role, user, onNavigate }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore errors on logout
    }
    router.push('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const profileHref = role === 'librarian' || role === 'admin'
    ? '/librarian/profile'
    : '/student/profile';

  return (
    <div className="flex h-full flex-col justify-between py-8 px-6">
      {/* Brand / Logo */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">EduShelf</h1>
            <p className="text-xs text-white/60">Library System</p>
          </div>
        </div>

        {/* Role Badge */}
        <div className="mb-6">
          <Badge className="bg-white/15 text-white border-0 hover:bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
            <GraduationCap className="h-3 w-3 mr-1.5" />
            {role === 'admin' ? 'Administrator' : role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        </div>

        <Separator className="bg-white/10 mb-4" />

        {/* Navigation Items */}
        <ScrollArea className="flex-1">
          <nav className="space-y-1" role="navigation" aria-label="Main navigation">
            {items.map((item) => {
              const isActive =
                currentPath === item.href ||
                (item.href !== '/' && currentPath.startsWith(item.href + '/'));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  role="menuitem"
                  aria-current={isActive ? 'page' : undefined}
                  className={`sidebar-link text-white/70 hover:text-white focus-ring ${
                    isActive ? 'sidebar-link-active text-white' : ''
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.name}</span>
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80" />
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </div>

      {/* User Profile Section at Bottom */}
      <div className="mt-6">
        <Separator className="bg-white/10 mb-4" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full rounded-2xl p-3 text-left transition-all duration-200 hover:bg-white/8 focus-ring" aria-label="User menu">
              <Avatar className="h-9 w-9 border-2 border-white/20">
                <AvatarFallback className="bg-white/20 text-white text-xs font-semibold border-0">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-white/50 truncate">{user?.email || ''}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-white/40 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48 rounded-xl">
            <DropdownMenuItem
              onClick={() => {
                router.push(profileHref);
                onNavigate?.();
              }}
              className="rounded-lg"
            >
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                router.push(profileHref);
                onNavigate?.();
              }}
              className="rounded-lg"
            >
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-[#F28B82] rounded-lg">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function Sidebar({ items, currentPath, role, user }) {
  const [open, setOpen] = useState(false);

  const sidebarItems =
    items ||
    (role === 'librarian' || role === 'admin' ? librarianItems : studentItems);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0  z-30">
        <SidebarContent
          items={sidebarItems}
          currentPath={currentPath}
          role={role}
          user={user}
        />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-40 h-10 w-10 rounded-xl bg-white/80 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[#5D7480] hover:bg-white/95 hover:text-[#1F2937] transition-all duration-200 border border-white/50"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0 bg-[#688997] border-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent
            items={sidebarItems}
            currentPath={currentPath}
            role={role}
            user={user}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
