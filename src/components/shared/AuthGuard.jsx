'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiFetch from '@/lib/fetcher';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function AuthGuard({ children, requiredRole }) {
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'unauthenticated'

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await apiFetch('/auth/me');
        const user = res.data.user;

        if (requiredRole && user.role !== requiredRole && requiredRole !== 'any') {
          // User doesn't have the required role
          if (user.role === 'student') {
            router.replace('/student/dashboard');
          } else if (user.role === 'librarian' || user.role === 'admin') {
            router.replace('/librarian/dashboard');
          } else {
            router.replace('/login');
          }
          return;
        }

        setStatus('authenticated');
      } catch (error) {
        setStatus('unauthenticated');
        router.replace('/login');
      }
    }

    checkAuth();
  }, [requiredRole, router]);

  if (status === 'loading') {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return children;
}
