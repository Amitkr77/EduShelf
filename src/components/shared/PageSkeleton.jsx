'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 sm:h-10 lg:h-[42px] w-48 sm:w-64 rounded-xl" />
        <Skeleton className="h-4 w-64 sm:w-80 rounded-lg" />
      </div>

      {/* Stats Cards Grid: 2x2 on mobile, 4x1 on desktop */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4 sm:p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-7 sm:h-8 w-24 rounded-lg" />
            <Skeleton className="h-3 w-28 rounded-md" />
          </div>
        ))}
      </div>

      {/* Chart Section + List Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Chart Skeleton */}
        <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="h-3 w-48 rounded-md" />
            </div>
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-[200px] sm:h-[280px] w-full rounded-xl" />
        </div>

        {/* List Skeleton */}
        <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="h-3 w-44 rounded-md" />
            </div>
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
                <Skeleton className="h-6 w-16 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Second Chart Skeleton */}
        <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-28 rounded-lg" />
              <Skeleton className="h-3 w-40 rounded-md" />
            </div>
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-[200px] sm:h-[260px] w-full rounded-xl" />
        </div>

        {/* Secondary List Skeleton */}
        <div className="rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="h-3 w-48 rounded-md" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3 rounded-lg" />
                  <Skeleton className="h-3 w-1/3 rounded-md" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
