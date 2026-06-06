'use client';

import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] w-full py-12">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-[#DDE7EA]" />
        <Loader2 className="absolute inset-0 h-12 w-12 animate-spin text-[#7C9AA5]" />
      </div>
      {message && (
        <p className="mt-4 text-sm text-[#6B7280]">{message}</p>
      )}
    </div>
  );
}
