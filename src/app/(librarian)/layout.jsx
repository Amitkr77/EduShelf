'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import apiFetch from '@/lib/fetcher';

export default function LibrarianLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await apiFetch('/auth/me');
        const fetchedUser = res.data.user;

        if (fetchedUser.role !== 'librarian' && fetchedUser.role !== 'admin') {
          if (fetchedUser.role === 'student') {
            router.replace('/student/dashboard');
          } else {
            router.replace('/login');
          }
          return;
        }

        setUser(fetchedUser);
      } catch (error) {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#688997] via-[#8CA5AF] to-[#C7BEB2]">
        <LoadingSpinner message="Loading admin panel..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user} activePath={pathname}>
      {children}
    </DashboardLayout>
  );
}
