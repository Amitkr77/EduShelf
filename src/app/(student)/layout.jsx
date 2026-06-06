'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import apiFetch from '@/lib/fetcher';

export default function StudentLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await apiFetch('/auth/me');
        const fetchedUser = res.data.user;

        // Check if user has student role
        if (fetchedUser.role !== 'student') {
          if (fetchedUser.role === 'librarian' || fetchedUser.role === 'admin') {
            router.replace('/librarian/dashboard');
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
    return <LoadingSpinner message="Loading your dashboard..." />;
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
