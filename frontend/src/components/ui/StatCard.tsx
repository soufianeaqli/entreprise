import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  iconBg?: string;
}

export function StatCard({ title, value, change, changeLabel, icon, iconBg }: StatCardProps) {
  const TrendIcon =
    change === undefined || change === 0
      ? Minus
      : change > 0
        ? TrendingUp
        : TrendingDown;

  const trendColor =
    change === undefined || change === 0
      ? 'text-surface-400'
      : change > 0
        ? 'text-emerald-600'
        : 'text-red-500';

  return (
    <div className="group bg-white rounded-xl border border-surface-200/60 p-5 shadow-sm shadow-surface-200/40 hover:shadow-md hover:shadow-surface-200/50 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-surface-500 truncate">{title}</p>
          <p className="mt-2 text-2xl font-bold text-surface-900 tracking-tight">{value}</p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <TrendIcon className={cn('w-3.5 h-3.5', trendColor)} />
              <span className={cn('text-xs font-medium', trendColor)}>
                {change > 0 ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-surface-400">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
            iconBg || 'bg-primary-50 text-primary-600',
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
