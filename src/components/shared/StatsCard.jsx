'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

const colorMap = {
  emerald: {
    bg: 'bg-[#E8F0EC]',
    icon: 'text-[#6B8F83]',
    trend: 'text-[#7CCB7A]',
  },
  teal: {
    bg: 'bg-[#DDE7EA]',
    icon: 'text-[#5D7480]',
    trend: 'text-[#7CCB7A]',
  },
  amber: {
    bg: 'bg-[#FEF3E2]',
    icon: 'text-[#C4952A]',
    trend: 'text-[#F3C47A]',
  },
  rose: {
    bg: 'bg-[#FDE8E6]',
    icon: 'text-[#C25B4F]',
    trend: 'text-[#F28B82]',
  },
  violet: {
    bg: 'bg-[#EDE8F5]',
    icon: 'text-[#7C5DA5]',
    trend: 'text-[#9B7CCB]',
  },
  info: {
    bg: 'bg-[#E3F2FA]',
    icon: 'text-[#4A8DB7]',
    trend: 'text-[#84C7E8]',
  },
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'emerald',
  comparison,
}) {
  const colors = colorMap[color] || colorMap.emerald;

  return (
    <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-white/90 backdrop-blur-[20px] border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover-lift cursor-default transition-all duration-200">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-medium text-[#6B7280] uppercase tracking-wide truncate">{title}</p>
          <p className="text-xl sm:text-[28px] font-bold tracking-tight text-[#1F2937]">{value}</p>
          {trend && trendValue && (
            <div className="flex items-center gap-1.5">
              {trend === 'up' ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-[#7CCB7A]" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-[#F28B82]" />
              )}
              <span
                className={`text-[10px] sm:text-xs font-semibold ${
                  trend === 'up' ? 'text-[#7CCB7A]' : 'text-[#F28B82]'
                }`}
              >
                {trendValue}
              </span>
            </div>
          )}
          {comparison && (
            <p className="text-[10px] sm:text-[11px] text-[#6B7280]/70 truncate">{comparison}</p>
          )}
        </div>
        {Icon && (
          <div
            className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl ${colors.bg} shrink-0`}
          >
            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colors.icon}`} />
          </div>
        )}
      </div>
    </div>
  );
}
