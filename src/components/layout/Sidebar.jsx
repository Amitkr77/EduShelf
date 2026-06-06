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
  ArrowRightLeft,
  RotateCcw,
  Users,
  Receipt,
  BarChart3,
  LogOut,
  ChevronLeft,
  GraduationCap,
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
];

function SidebarContent({ items, currentPath, role, onNavigate }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore errors on logout
    }
    router.push('/login');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground">EduShelf</h1>
          <p className="text-xs text-muted-foreground">Library System</p>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-4 pb-3">
        <Badge
          variant="secondary"
          className={
            role === 'librarian' || role === 'admin'
              ? 'bg-teal-100 text-teal-700 hover:bg-teal-100'
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
          }
        >
          <GraduationCap className="h-3 w-3 mr-1" />
          {role === 'admin' ? 'Administrator' : role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
      </div>

      <Separator />

      {/* Navigation Items */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-1">
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
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? 'text-emerald-600' : 'text-muted-foreground'
                  }`}
                />
                {item.name}
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600" />
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Logout Button */}
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
}

export default function Sidebar({ items, currentPath, role }) {
  const [open, setOpen] = useState(false);

  // Get the right items based on role
  const sidebarItems =
    items ||
    (role === 'librarian' || role === 'admin' ? librarianItems : studentItems);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r bg-white">
        <SidebarContent
          items={sidebarItems}
          currentPath={currentPath}
          role={role}
        />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-3 left-3 z-40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent
            items={sidebarItems}
            currentPath={currentPath}
            role={role}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
