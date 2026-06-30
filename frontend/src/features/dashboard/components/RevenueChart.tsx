import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RevenueDataPoint } from '@/apis/report.api'

interface RevenueChartProps {
  data: RevenueDataPoint[]
  isLoading: boolean
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatLabel(value: string) {
  const parts = value.split('-')
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : value
}

/**
 * Generate the last 7 days as yyyy-MM-dd strings, ending at today.
 */
function getLast7Days(): string[] {
  const days: string[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    days.push(`${yyyy}-${mm}-${dd}`)
  }
  return days
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  const safeData = Array.isArray(data) ? data : []

  // Always show 7 days, filling missing days with 0
  const chartData = useMemo(() => {
    const dataMap = new Map(safeData.map((item) => [item.label, item]))
    return getLast7Days().map((date) => {
      const existing = dataMap.get(date)
      return {
        label: date,
        revenue: existing ? Number(existing.revenue) || 0 : 0,
        orderCount: existing ? existing.orderCount : 0,
      }
    })
  }, [safeData])

  const maxRevenue = Math.max(...chartData.map((item) => item.revenue), 0)

  return (
    <Card className="h-full transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Doanh thu theo ngày</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mt-4 h-[300px] w-full">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500" />
            </div>
          ) : (
            <div className="flex h-full items-end gap-3 rounded-xl border bg-muted/20 p-4">
              {chartData.map((item) => {
                const revenue = item.revenue
                const percent = maxRevenue > 0 ? Math.max((revenue / maxRevenue) * 100, 4) : 4
                return (
                  <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
                    <div className="group relative flex flex-1 items-end">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-300 transition-all group-hover:from-emerald-600"
                        style={{ height: `${percent}%` }}
                      />
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block">
                        {formatCurrency(revenue)}
                      </div>
                    </div>
                    <p className="truncate text-center text-xs text-muted-foreground">{formatLabel(item.label)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
