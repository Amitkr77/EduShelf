'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and redirect accordingly
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (data.success && data.data?.user) {
          const role = data.data.user.role;
          if (role === 'librarian' || role === 'admin') {
            router.replace('/librarian/dashboard');
          } else {
            router.replace('/student/dashboard');
          }
          return;
        }
      } catch (e) {
        // Not authenticated
      }
      router.replace('/login');
    }

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 mb-6 animate-pulse">
        <BookOpen className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">EduShelf</h1>
      <p className="text-muted-foreground text-sm">Redirecting...</p>
    </div>
  );
}
