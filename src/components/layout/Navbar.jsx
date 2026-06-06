'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  X,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import apiFetch from '@/lib/fetcher';

export default function Navbar({ user, onMobileMenuToggle }) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await apiFetch('/notifications?limit=100');
        const unread = res.data?.items?.filter(n => !n.isRead)?.length || 0;
        setUnreadCount(unread);
      } catch (e) {
        // ignore
      }
    }
    if (user) fetchNotifications();
  }, [user]);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore errors on logout
    }
    router.push('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const basePath = user?.role === 'librarian' || user?.role === 'admin' ? '/librarian' : '/student';
      router.push(`${basePath}/books?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB]/60">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-8">
        {/* Mobile menu spacer */}
        <div className="w-10 lg:hidden" />

        {/* Page Title - visible on desktop */}
        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold text-[#1F2937]">Dashboard</h2>
        </div>

        {/* Search */}
        <div className="flex-1 flex items-center justify-center lg:justify-end">
          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden sm:flex relative w-full max-w-[360px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              type="search"
              placeholder="Search..."
              aria-label="Search books and records"
              className="pl-11 h-12 bg-[#F9FAFB] border-[#E5E7EB] rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-[#5D7480] focus-visible:ring-offset-0 focus-visible:border-[#5D7480] placeholder:text-[#6B7280]/60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden h-10 w-10 rounded-xl text-[#6B7280]"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Toggle search"
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Messages Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-full text-[#6B7280] hover:bg-[#F4F8F9] hover:text-[#5D7480] transition-colors duration-200 focus-ring"
            aria-label="Messages"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-11 w-11 rounded-full text-[#6B7280] hover:bg-[#F4F8F9] hover:text-[#5D7480] transition-colors duration-200 focus-ring"
            onClick={() => {
              const basePath = user?.role === 'librarian' || user?.role === 'admin' ? '/librarian' : '/student';
              router.push(`${basePath}/notifications`);
            }}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F28B82] text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-11 w-11 rounded-full hover:bg-[#F4F8F9] focus-ring" aria-label="User menu">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-[#7C9AA5] text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)]" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-[#1F2937]">{user?.name || 'User'}</p>
                  <p className="text-xs leading-none text-[#6B7280]">
                    {user?.email || ''}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => {
                    const basePath = user?.role === 'librarian' || user?.role === 'admin' ? '/librarian' : '/student';
                    router.push(`${basePath}/profile`);
                  }}
                  className="rounded-lg focus-ring"
                >
                  <User className="mr-2 h-4 w-4 text-[#6B7280]" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg focus-ring">
                  <Settings className="mr-2 h-4 w-4 text-[#6B7280]" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-[#F28B82] rounded-lg focus-ring">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile search bar (expandable) */}
      {searchOpen && (
        <div className="sm:hidden border-t border-[#E5E7EB]/60 px-4 py-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              type="search"
              placeholder="Search..."
              aria-label="Search"
              className="pl-11 h-12 bg-[#F9FAFB] border-[#E5E7EB] rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-[#5D7480]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </form>
        </div>
      )}
    </header>
  );
}
