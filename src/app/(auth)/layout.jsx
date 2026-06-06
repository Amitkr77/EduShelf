import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#688997] via-[#8CA5AF] to-[#C7BEB2] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 mb-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white shadow-lg">
              <BookOpen className="h-7 w-7" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">EduShelf</h1>
          <p className="text-sm text-white/60 mt-1">
            Library Management System
          </p>
        </div>

        {/* Auth Card - Glassmorphism */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.12)] border border-white/40 overflow-hidden p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-white/40">
          &copy; {new Date().getFullYear()} EduShelf. All rights reserved.
        </p>
      </div>
    </div>
  );
}
