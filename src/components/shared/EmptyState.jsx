'use client';

import { Button } from '@/components/ui/button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center rounded-2xl sm:rounded-3xl border border-dashed border-[#E5E7EB] bg-white/5 backdrop-blur-sm">
      <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#DDE7EA] mb-3 sm:mb-4">
        {Icon && <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-[#5D7480]" />}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-[#1F2937] mb-1">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-[#6B7280] max-w-xs sm:max-w-sm mb-3 sm:mb-4 px-4">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-[#7C9AA5] hover:bg-[#5D7480] text-white rounded-xl transition-colors duration-200 focus-ring h-10 px-5 text-sm"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
