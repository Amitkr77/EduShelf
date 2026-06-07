'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Search, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/student/books?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#688997] via-[#8CA5AF] to-[#C7BEB2] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        {/* Glass Card */}
        <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6 sm:p-10 text-center">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7C9AA5]">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[#1F2937] tracking-tight">EduShelf</span>
          </div>

          {/* 404 Illustration */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#F4F8F9] mb-4">
              <span className="text-5xl sm:text-6xl font-bold text-[#7C9AA5]">404</span>
            </div>
          </div>

          {/* Message */}
          <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-bold tracking-tight text-[#1F2937] mb-3">
            Page Not Found
          </h1>
          <p className="text-[#6B7280] text-sm sm:text-base mb-8 max-w-sm mx-auto">
            Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved. Let us help you find your way back.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative mb-6">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <Input
              type="search"
              placeholder="Search for books, authors..."
              aria-label="Search for books"
              className="pl-11 h-12 bg-[#F9FAFB] border-[#E5E7EB] rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-[#5D7480] focus-visible:ring-offset-0 focus-visible:border-[#5D7480] placeholder:text-[#6B7280]/60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Navigation Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              className="w-full sm:w-auto bg-[#7C9AA5] hover:bg-[#5D7480] text-white rounded-xl h-11 transition-all duration-200"
            >
              <Link href="/student/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Student Dashboard
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto border-[#E5E7EB] text-[#1F2937] hover:bg-[#F4F8F9] rounded-xl h-11 transition-all duration-200"
            >
              <Link href="/librarian/dashboard">
                <BookOpen className="h-4 w-4 mr-2" />
                Librarian Dashboard
              </Link>
            </Button>
          </div>

          {/* Back Button */}
          <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
            <Button
              variant="ghost"
              className="text-[#6B7280] hover:text-[#1F2937] hover:bg-transparent rounded-xl transition-colors duration-200"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-white/50 text-xs mt-6">
          EduShelf Library Management System
        </p>
      </div>
    </div>
  );
}
