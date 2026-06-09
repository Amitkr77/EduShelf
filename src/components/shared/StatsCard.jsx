'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'emerald',
  comparison,
}) {
  return (
    <div
      className="
        relative overflow-hidden
        rounded-2xl
        px-4 py-3.5
        bg-white/[0.04]
        backdrop-blur-xl
        border border-white/8
        hover:bg-white/[0.06]
        transition-all duration-300
      "
    >
      {/* subtle highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent pointer-events-none" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 truncate">
            {title}
          </p>

          <div className="mt-1 flex items-end gap-2">
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              {value}
            </h3>

            {trend && trendValue && (
              <div
                className={`flex items-center gap-1 text-[11px] font-medium ${
                  trend === 'up'
                    ? 'text-emerald-300'
                    : 'text-red-300'
                }`}
              >
                {trend === 'up' ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {trendValue}
              </div>
            )}
          </div>

          {comparison && (
            <p className="mt-1 text-[11px] text-white/40 truncate">
              {comparison}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-xl
              bg-white/[0.05]
              border border-white/10
            "
          >
            <Icon className="h-4.5 w-4.5 text-white/80" />
          </div>
        )}
      </div>
    </div>
  );
}