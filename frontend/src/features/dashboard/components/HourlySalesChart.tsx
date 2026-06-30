import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HourlySales } from '@/apis/report.api'

interface HourlySalesChartProps {
  data: HourlySales[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export function HourlySalesChart({ data }: HourlySalesChartProps) {
  const OPEN_HOUR = 5
  const CLOSE_HOUR = 21

  const safeData = Array.isArray(data) ? data : []

  const businessHourData = safeData.filter((item) => {
    const hour = Number(item.hour)
    return hour >= OPEN_HOUR && hour <= CLOSE_HOUR
  })

  const currentHour = new Date().getHours()

  const maxRevenue = Math.max(
    ...businessHourData.map((item) => Number(item.revenue) || 0),
    0,
  )

  return (
    <Card className="col-span-full transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Doanh số theo giờ</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="mt-2 h-[250px] w-full">
          {businessHourData.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              Không có dữ liệu
            </div>
          ) : (
            <div className="flex h-full items-end gap-2 overflow-x-auto rounded-xl border bg-muted/20 p-4">
              {businessHourData.map((item) => {
                const hour = Number(item.hour)
                const revenue = Number(item.revenue) || 0
                const orderCount = Number(item.orderCount) || 0
                const percent =
                  maxRevenue > 0 ? Math.max((revenue / maxRevenue) * 100, 5) : 5
                const isCurrent = hour === currentHour

                return (
                  <div
                    key={item.hour}
                    className="flex h-full min-w-10 flex-1 flex-col justify-end gap-2"
                  >
                    <div className="group relative flex flex-1 items-end">
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          isCurrent ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ height: `${percent}%` }}
                      />

                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block">
                        {formatCurrency(revenue)} · {orderCount} đơn
                      </div>
                    </div>

                    <p
                      className={`text-center text-xs ${
                        isCurrent
                          ? 'font-bold text-amber-600'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {hour}h
                    </p>
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
