'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
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
} from 'lucide-react';

const studentItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/student/dashboard' },
  { icon: Search, label: 'Books', href: '/student/books' },
  { icon: BookMarked, label: 'My Books', href: '/student/my-books' },
  { icon: CalendarCheck, label: 'Reserves', href: '/student/reservations' },
  { icon: Heart, label: 'Wishlist', href: '/student/wishlist' },
  { icon: Bell, label: 'Alerts', href: '/student/notifications' },
  { icon: UserCircle, label: 'Profile', href: '/student/profile' },
];

const librarianItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/librarian/dashboard' },
  { icon: Library, label: 'Books', href: '/librarian/books' },
  { icon: BookPlus, label: 'Issues', href: '/librarian/issues' },
  { icon: RotateCcw, label: 'Returns', href: '/librarian/returns' },
  { icon: Users, label: 'Students', href: '/librarian/students' },
  { icon: Receipt, label: 'Fines', href: '/librarian/fines' },
  { icon: BarChart3, label: 'Reports', href: '/librarian/reports' },
];

function mod(n, m) {
  return ((n % m) + m) % m;
}

export default function MobileDock({ role = 'student' }) {
  const router = useRouter();
  const pathname = usePathname();
  const items = role === 'librarian' || role === 'admin' ? librarianItems : studentItems;

  // Find the active index based on current path
  const activeIndex = useMemo(() => {
    const exact = items.findIndex((item) => pathname === item.href);
    if (exact !== -1) return exact;
    const partial = items.findIndex(
      (item) => item.href !== '/' && pathname.startsWith(item.href + '/')
    );
    if (partial !== -1) return partial;
    return 0;
  }, [pathname, items]);

  const [active, setActive] = useState(activeIndex);
  const [touchStart, setTouchStart] = useState(null);

  useEffect(() => {
    setActive(activeIndex);
  }, [activeIndex]);

  const handleNavigate = useCallback(
    (idx) => {
      setActive(idx);
      router.push(items[idx].href);
    },
    [router, items]
  );

  // Swipe support
  const handleTouchStart = useCallback((e) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (touchStart === null) return;
      const endX = e.changedTouches[0].clientX;
      const diff = touchStart - endX;

      if (diff > 40) {
        // Swipe left → next
        const next = mod(active + 1, items.length);
        handleNavigate(next);
      } else if (diff < -40) {
        // Swipe right → previous
        const prev = mod(active - 1, items.length);
        handleNavigate(prev);
      }
      setTouchStart(null);
    },
    [touchStart, active, items.length, handleNavigate]
  );

  // Render visible tabs around active
  const maxVisible = 3;
  const centerX = 50; // percent

  return (
    <div
      className="dock-container lg:hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="dock">
        <div className="dock-track">
          {Array.from({ length: maxVisible * 2 + 1 }, (_, i) => {
            const offset = i - maxVisible;
            const idx = mod(active + offset, items.length);
            const item = items[idx];
            const isActive = offset === 0;
            const Icon = item.icon;

            // Position calculation
            const spacing = 72;
            const leftPercent = centerX;
            const leftOffset = offset * spacing;

            // 3D arc effect
            const scale = isActive ? 1.18 : 0.72 + (1 - Math.abs(offset) * 0.14);
            const translateY = isActive ? -22 : Math.abs(offset) * 8;
            const rotateX = Math.abs(offset) * 8;
            const opacity = 1 - Math.abs(offset) * 0.2;

            return (
              <button
                key={`${idx}-${offset}`}
                className={`dock-tab ${isActive ? 'dock-tab-active' : ''}`}
                style={{
                  left: `calc(${leftPercent}% + ${leftOffset}px - 28px)`,
                  opacity: Math.max(opacity, 0),
                  transform: `translateY(${translateY}px) scale(${scale}) rotateX(${rotateX}deg)`,
                }}
                onClick={() => handleNavigate(idx)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={`dock-label ${isActive ? 'dock-label-visible' : ''}`}>
                  {item.label}
                </span>
                <Icon className="dock-icon" strokeWidth={isActive ? 2.2 : 1.8} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
