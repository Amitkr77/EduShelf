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
   { icon: Bell, label: 'Alerts', href: '/librarian/notifications' },
];

function mod(n, m) {
  return ((n % m) + m) % m;
}

const transitionStyle = 'all 0.4s cubic-bezier(0.32, 0.72, 0, 1)';

export default function MobileDock({ role = 'student' }) {
  const router = useRouter();
  const pathname = usePathname();
  const items = role === 'librarian' || role === 'admin' ? librarianItems : studentItems;

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

  const handleTouchStart = useCallback((e) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (touchStart === null) return;
      const endX = e.changedTouches[0].clientX;
      const diff = touchStart - endX;

      if (diff > 40) {
        const next = mod(active + 1, items.length);
        handleNavigate(next);
      } else if (diff < -40) {
        const prev = mod(active - 1, items.length);
        handleNavigate(prev);
      }
      setTouchStart(null);
    },
    [touchStart, active, items.length, handleNavigate]
  );

  const maxVisible = 3;
  const centerX = 50;
  const spacing = 72;

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

            const dist = Math.abs(offset);
            const leftOffset = offset * spacing;
            const scale = isActive ? 1.12 : 0.85 - dist * 0.04;
            const opacity = dist === 0 ? 1 : dist === 1 ? 0.55 : 0.15;

            return (
              <button
                key={`${idx}-${offset}`}
                className={`dock-tab ${isActive ? 'dock-tab-active' : ''}`}
                style={{
                  left: `calc(${centerX}% + ${leftOffset}px - 28px)`,
                  opacity,
                  transform: `scale(${scale})`,
                  transition: transitionStyle,
                }}
                onClick={() => handleNavigate(idx)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <span
                  className={`dock-label ${isActive ? 'dock-label-visible' : ''}`}
                  style={{ transition: transitionStyle }}
                >
                  {item.label}
                </span>
                <Icon
                  className="dock-icon"
                  strokeWidth={isActive ? 2.2 : 1.5}
                  style={{ transition: transitionStyle }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}