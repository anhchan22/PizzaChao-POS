import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TopProduct } from '@/apis/report.api'

interface TopProductsChartProps {
  data: TopProduct[]
}

const COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-pink-500']

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  const safeData = Array.isArray(data) ? data : []
  const maxQuantity = Math.max(...safeData.map((item) => Number(item.quantitySold) || 0), 0)

  return (
    <Card className="flex h-full flex-col transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Top món bán chạy</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center">
        {safeData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Chưa có đơn hàng nào trong khoảng đã chọn
          </div>
        ) : (
          <div className="flex h-[300px] flex-col justify-center gap-4">
            {safeData.slice(0, 5).map((item, index) => {
              const quantitySold = Number(item.quantitySold) || 0
              const revenue = Number(item.revenue) || 0
              const percent = maxQuantity > 0 ? Math.max((quantitySold / maxQuantity) * 100, 6) : 6
              return (
                <div key={`${item.productName}-${index}`} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{item.productName}</span>
                    <span className="whitespace-nowrap text-muted-foreground">
                      {quantitySold} món · {formatCurrency(revenue)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${COLORS[index % COLORS.length]}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
