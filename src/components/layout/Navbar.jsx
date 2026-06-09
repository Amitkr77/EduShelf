"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, User, LogOut, X, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import apiFetch from "@/lib/fetcher";

const pageTitles = {
  "/student/dashboard": "Dashboard",
  "/student/books": "Browse Books",
  "/student/my-books": "My Books",
  "/student/reservations": "Reservations",
  "/student/wishlist": "Wishlist",
  "/student/notifications": "Notifications",
  "/student/profile": "Profile",
  "/librarian/dashboard": "Librarian Dashboard",
  "/librarian/books": "Manage Books",
  "/librarian/issues": "Issue Books",
  "/librarian/returns": "Returns",
  "/librarian/students": "Students",
  "/librarian/fines": "Fines",
  "/librarian/reports": "Reports",
  "/librarian/notifications": "Notifications",
  "/librarian/profile": "Profile",
};

export default function Navbar({ user, activePath }) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  // Dynamic page title
  const pageTitle = useMemo(() => {
    if (!activePath) return "Dashboard";
    if (pageTitles[activePath]) return pageTitles[activePath];
    // Handle dynamic routes like /student/books/123
    const base = "/" + activePath.split("/").slice(1, 3).join("/");
    return pageTitles[base] || "Dashboard";
  }, [activePath]);

  // Update document title when page changes
  useEffect(() => {
    document.title = `${pageTitle} | EduShelf`;
  }, [pageTitle]);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await apiFetch("/notifications?limit=100");
        const unread = res.data?.items?.filter((n) => !n.isRead)?.length || 0;
        setUnreadCount(unread);
      } catch (e) {
        // ignore
      }
    }
    if (user) fetchNotifications();
  }, [user]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore errors on logout
    }
    router.push("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const basePath =
        user?.role === "librarian" || user?.role === "admin"
          ? "/librarian"
          : "/student";
      router.push(
        `${basePath}/books?search=${encodeURIComponent(searchQuery.trim())}`,
      );
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-20  backdrop-blur-md pt-5">
      <div className="flex h-14 sm:h-16 items-center gap-3 sm:gap-4 px-3 sm:px-4 lg:px-8">
        {/* Mobile menu spacer for sheet trigger */}
        {/* <div className="w-10 lg:hidden" /> */}

        {/* Page Title */}
        <div className="hidden lg:block min-w-0">
          <h2 className="text-4xl font-semibold text-white truncate">
            {pageTitle}
          </h2>
        </div>

        {/* Mobile page title */}
        <div className="lg:hidden flex-1 min-w-0">
          <h2 className="text-md font-semibold text-white truncate">
            {pageTitle}
          </h2>
        </div>

        {/* Search */}
        <div className="hidden sm:flex items-center flex-1 justify-end">
          <form
            onSubmit={handleSearch}
            className="relative w-full max-w-[360px]"
          >
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
            <Input
              type="search"
              placeholder="Search books..."
              aria-label="Search books and records"
              className="pl-11 h-11   rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-0 focus-visible:border-white placeholder:text-white/60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden h-9 w-9 rounded-xl text-white"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Toggle search"
          >
            {searchOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>

          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-full text-white hover:bg-[#F4F8F9] hover:text-[#5D7480] transition-colors duration-200 focus-ring"
            onClick={() => {
              const basePath =
                user?.role === "librarian" || user?.role === "admin"
                  ? "/librarian"
                  : "/student";
              router.push(`${basePath}/notifications`);
            }}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F28B82] text-[9px] sm:text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-full hover:bg-[#F4F8F9] focus-ring"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                  <AvatarFallback className="bg-[#7C9AA5] text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-[#1F2937]">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs leading-none text-[#6B7280]">
                    {user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => {
                    const basePath =
                      user?.role === "librarian" || user?.role === "admin"
                        ? "/librarian"
                        : "/student";
                    router.push(`${basePath}/profile`);
                  }}
                  className="rounded-lg focus-ring"
                >
                  <User className="mr-2 h-4 w-4 text-[#6B7280]" />
                  Profile
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-[#F28B82] rounded-lg focus-ring"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile search bar (expandable) */}
      {searchOpen && (
        <div className="sm:hidden border-t border-[#E5E7EB]/60 px-3 py-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              type="search"
              placeholder="Search books..."
              aria-label="Search"
              className="pl-11 h-11 bg-[#F9FAFB] border-[#E5E7EB] rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-[#5D7480]"
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
