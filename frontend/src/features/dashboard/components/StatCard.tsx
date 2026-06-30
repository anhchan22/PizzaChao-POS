import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  iconColorClass?: string
  iconBgClass?: string
  trendValue?: number
  trendLabel?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColorClass = "text-slate-600",
  iconBgClass = "bg-slate-100",
  trendValue,
  trendLabel
}: StatCardProps) {
  const isPositive = trendValue && trendValue > 0;
  const isNegative = trendValue && trendValue < 0;

  return (
    <Card className="overflow-hidden bg-white border-slate-200 shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-sm font-medium text-slate-500">{title}</h3>
          <div className={cn("p-2 rounded-md", iconBgClass)}>
            <Icon className={cn("w-4 h-4", iconColorClass)} />
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">{value}</span>
            {subtitle && <span className="text-xs font-medium text-slate-500">{subtitle}</span>}
          </div>
        </div>

        {trendValue !== undefined && (
          <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-slate-100">
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            ) : isNegative ? (
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-slate-200" /> // Neutral
            )}
            <span className={cn(
              "text-xs font-semibold",
              isPositive ? "text-emerald-600" : isNegative ? "text-rose-600" : "text-slate-500"
            )}>
              {isPositive ? '+' : ''}{trendValue}%
            </span>
            {trendLabel && (
              <span className="text-xs text-slate-400">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
