'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

const colorMap = {
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    trend: 'text-emerald-600',
  },
  teal: {
    bg: 'bg-teal-50',
    icon: 'text-teal-600',
    trend: 'text-teal-600',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    trend: 'text-amber-600',
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'text-rose-600',
    trend: 'text-rose-600',
  },
  violet: {
    bg: 'bg-violet-50',
    icon: 'text-violet-600',
    trend: 'text-violet-600',
  },
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'emerald',
}) {
  const colors = colorMap[color] || colorMap.emerald;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {trend && trendValue && (
              <div className="flex items-center gap-1">
                {trend === 'up' ? (
                  <TrendingUp className={`h-4 w-4 ${colors.trend}`} />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                )}
                <span
                  className={`text-xs font-medium ${
                    trend === 'up' ? colors.trend : 'text-rose-500'
                  }`}
                >
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          {Icon && (
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg}`}
            >
              <Icon className={`h-6 w-6 ${colors.icon}`} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
