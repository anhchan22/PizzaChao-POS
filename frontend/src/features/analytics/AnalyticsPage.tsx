import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Banknote,
  CalendarDays,
  ChartNoAxesCombined,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import { reportApi, type RevenueDataPoint, type ShiftSummary } from '@/apis/report.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const numberFormat = new Intl.NumberFormat('vi-VN')
const paymentColors = ['#00bc7d', '#007a55']
const expenseColors = ['#00bc7d', '#f59e0b', '#e11d48', '#8b5cf6', '#06b6d4']

type Preset = 'TODAY' | '7D' | 'MONTH' | 'QUARTER' | 'CUSTOM'

const expenseTypeLabels: Record<string, string> = {
  INGREDIENT: 'Nguyên vật liệu',
  PACKAGING: 'Bao bì / vật tư',
  UTILITY: 'Điện nước / gas',
  REPAIR: 'Sửa chữa',
  OTHER: 'Khác',
}

function toDateValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10)
}

function getRangeByPreset(preset: Preset) {
  const today = new Date()
  const from = new Date(today)

  if (preset === 'TODAY') return { from: toDateValue(today), to: toDateValue(today) }
  if (preset === '7D') {
    from.setDate(today.getDate() - 6)
    return { from: toDateValue(from), to: toDateValue(today) }
  }
  if (preset === 'MONTH') {
    from.setDate(1)
    return { from: toDateValue(from), to: toDateValue(today) }
  }
  if (preset === 'QUARTER') {
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3
    from.setMonth(quarterStartMonth, 1)
    return { from: toDateValue(from), to: toDateValue(today) }
  }

  return { from: toDateValue(today), to: toDateValue(today) }
}

function daysBetween(from: string, to: string) {
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1
}

function groupByForRange(from: string, to: string): 'DAY' | 'WEEK' | 'MONTH' {
  const days = daysBetween(from, to)
  if (days > 75) return 'MONTH'
  if (days > 31) return 'WEEK'
  return 'DAY'
}

function rangeError(from: string, to: string) {
  if (!from || !to) return 'Vui lòng chọn đủ ngày bắt đầu và kết thúc.'
  const days = daysBetween(from, to)
  if (days <= 0) return 'Ngày kết thúc không được trước ngày bắt đầu.'
  if (days > 93) return 'Khoảng thời gian thống kê tối đa là 3 tháng.'
  return ''
}

export default function AnalyticsPage() {
  const defaultRange = useMemo(() => getRangeByPreset('MONTH'), [])
  const [preset, setPreset] = useState<Preset>('MONTH')
  const [fromDate, setFromDate] = useState(defaultRange.from)
  const [toDate, setToDate] = useState(defaultRange.to)

  const error = rangeError(fromDate, toDate)
  const enabled = !error
  const params = { from: fromDate, to: toDate }
  const groupBy = groupByForRange(fromDate, toDate)

  const dashboardQuery = useQuery({
    queryKey: ['analytics-dashboard', fromDate, toDate],
    queryFn: () => reportApi.getDashboard(params),
    enabled,
  })

  const revenueQuery = useQuery({
    queryKey: ['analytics-revenue', fromDate, toDate, groupBy],
    queryFn: () => reportApi.getRevenue({ ...params, groupBy }),
    enabled,
  })

  const hourlyQuery = useQuery({
    queryKey: ['analytics-hourly', fromDate, toDate],
    queryFn: () => reportApi.getHourlySales(params),
    enabled,
  })

  const paymentQuery = useQuery({
    queryKey: ['analytics-payment', fromDate, toDate],
    queryFn: () => reportApi.getRevenueByPaymentMethod(params),
    enabled,
  })

  const profitQuery = useQuery({
    queryKey: ['analytics-profit', fromDate, toDate],
    queryFn: () => reportApi.getProfitEstimate(params),
    enabled,
  })

  const shiftQuery = useQuery({
    queryKey: ['analytics-shifts', fromDate, toDate],
    queryFn: () => reportApi.getShiftSummary(params),
    enabled,
  })

  const cancelQuery = useQuery({
    queryKey: ['analytics-cancel', fromDate, toDate],
    queryFn: () => reportApi.getCancelStats(params),
    enabled,
  })

  const dashData = dashboardQuery.data
  const profitData = profitQuery.data
  const paymentData = paymentQuery.data
  const revenueData = revenueQuery.data ?? []
  const revenueSeries = useMemo(
    () => normalizeRevenueSeries(revenueData, fromDate, toDate, groupBy),
    [revenueData, fromDate, toDate, groupBy],
  )
  const hourlyData = (hourlyQuery.data ?? []).filter((item) => item.hour >= 5 && item.hour <= 22)
  const staffRows = useMemo(() => buildStaffPerformance(shiftQuery.data ?? []), [shiftQuery.data])

  const paymentChartData = [
    { label: 'Tiền mặt', value: Number(paymentData?.cashRevenue ?? 0), count: paymentData?.cashCount ?? 0, color: paymentColors[0] },
    { label: 'Chuyển khoản', value: Number(paymentData?.transferRevenue ?? 0), count: paymentData?.transferCount ?? 0, color: paymentColors[1] },
  ].filter((item) => item.value > 0 || item.count > 0)

  const expenseChartData = (profitData?.expensesByType ?? []).map((item, index) => ({
    label: expenseTypeLabels[item.type] ?? item.type,
    value: Number(item.amount) || 0,
    color: expenseColors[index % expenseColors.length],
  }))

  const applyPreset = (nextPreset: Preset) => {
    setPreset(nextPreset)
    if (nextPreset !== 'CUSTOM') {
      const nextRange = getRangeByPreset(nextPreset)
      setFromDate(nextRange.from)
      setToDate(nextRange.to)
    }
  }

  return (
    <div className="min-h-[calc(100vh-1.5rem)] rounded-2xl bg-[#d2f2e7] p-3 text-[#022c22] sm:p-4">
      <div className="w-full space-y-4">
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-black tracking-[-0.05em] text-[#022c22]">
                <BarChart3 className="h-8 w-8 text-[#007a55]" />
                Thống kê kinh doanh
              </h1>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-wrap gap-1 rounded-full border border-[#e5e7eb] bg-[#f5f5f5] p-1">
                {[
                  ['TODAY', 'Ngày'],
                  ['7D', '7 ngày'],
                  ['MONTH', 'Tháng'],
                  ['QUARTER', 'Quý'],
                  ['CUSTOM', 'Tùy chỉnh'],
                ].map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant="ghost"
                    className={cn(
                      'h-8 rounded-full px-3 text-xs',
                      preset === value && 'bg-[#022c22] text-white hover:bg-[#022c22] hover:text-white',
                    )}
                    onClick={() => applyPreset(value as Preset)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <DateInput id="analyticsFrom" label="Từ" value={fromDate} onChange={(value) => { setPreset('CUSTOM'); setFromDate(value) }} />
              <DateInput id="analyticsTo" label="Đến" value={toDate} onChange={(value) => { setPreset('CUSTOM'); setToDate(value) }} />
            </div>
          </div>
          {error && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard title="Tổng doanh thu" value={currency.format(dashData?.todayRevenue ?? 0)} icon={Banknote} isLoading={dashboardQuery.isLoading} />
          <MetricCard title="Tổng đơn" value={numberFormat.format(dashData?.todayOrders ?? 0)} icon={ShoppingCart} isLoading={dashboardQuery.isLoading} />
          <MetricCard title="Tổng chi phí" value={currency.format(profitData?.expenses ?? 0)} icon={ReceiptText} isLoading={profitQuery.isLoading} />
          <MetricCard title="Lợi nhuận ước tính" value={currency.format(profitData?.profit ?? 0)} icon={TrendingUp} isLoading={profitQuery.isLoading} />
          <MetricCard title="Tỷ lệ hủy" value={`${cancelRate(cancelQuery.data?.totalCancelled ?? 0, dashData?.todayOrders ?? 0)}%`} icon={CalendarDays} isLoading={cancelQuery.isLoading || dashboardQuery.isLoading} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <AnalyticsCard
            title="Doanh thu theo thời gian"
            description=""
          >
            <RevenueBarChart data={revenueSeries} />
          </AnalyticsCard>

          <AnalyticsCard title="Cơ cấu thanh toán" description="">
            {paymentChartData.length === 0 ? (
              <EmptyChart />
            ) : (
              <DonutBreakdown data={paymentChartData} />
            )}
            <LegendList items={paymentChartData.map((item) => ({ label: item.label, value: currency.format(item.value), color: item.color }))} />
          </AnalyticsCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <AnalyticsCard title="Doanh số theo giờ"  description="">
            <BarChartLite
              data={hourlyData.map((item) => ({
                label: `${item.hour}h`,
                value: Number(item.revenue) || 0,
                helper: `${item.orderCount} đơn`,
              }))}
            />
          </AnalyticsCard>

          <AnalyticsCard title="Phân tích chi phí" description="">
            {expenseChartData.length === 0 ? (
              <EmptyChart />
            ) : (
              <HorizontalBarChartLite data={expenseChartData} />
            )}
          </AnalyticsCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_0.7fr]">
          <AnalyticsCard title="Hiệu suất nhân viên" description="">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e7eb] text-left text-xs uppercase tracking-[0.12em] text-[#71717a]">
                    <th className="py-3">Nhân viên</th>
                    <th className="py-3 text-right">Số ca</th>
                    <th className="py-3 text-right">Số đơn</th>
                    <th className="py-3 text-right">Doanh thu</th>
                    <th className="py-3 text-right">TB / ca</th>
                  </tr>
                </thead>
                <tbody>
                  {staffRows.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 text-center text-[#71717a]">Chưa có dữ liệu nhân viên.</td></tr>
                  ) : staffRows.map((staff) => (
                    <tr key={staff.staffName} className="border-b border-[#e5e7eb]/70">
                      <td className="py-3 font-bold text-[#022c22]">{staff.staffName}</td>
                      <td className="py-3 text-right">{staff.shiftCount}</td>
                      <td className="py-3 text-right">{staff.orderCount}</td>
                      <td className="py-3 text-right font-bold text-[#007a55]">{currency.format(staff.revenue)}</td>
                      <td className="py-3 text-right">{currency.format(staff.averageRevenuePerShift)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnalyticsCard>

          <AnalyticsCard title="Đơn hủy" description="">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <MiniStat label="Số đơn hủy" value={String(cancelQuery.data?.totalCancelled ?? 0)} />
              <MiniStat label="Doanh thu mất" value={currency.format(cancelQuery.data?.totalLostRevenue ?? 0)} danger />
            </div>
            <div className="mt-3 space-y-2">
              {(cancelQuery.data?.topReasons ?? []).slice(0, 5).map((reason) => (
                <div key={reason.reason} className="flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-sm">
                  <span className="truncate text-[#022c22]">{reason.reason}</span>
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">{reason.count}</span>
                </div>
              ))}
            </div>
          </AnalyticsCard>
        </section>
      </div>
    </div>
  )
}

function DateInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-[#71717a]">{label}</Label>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-[150px] rounded-full border-[#e5e7eb] bg-white"
      />
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, isLoading }: { title: string; value: string; icon: typeof Banknote; isLoading: boolean }) {
  return (
    <Card className="border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#71717a]">{title}</p>
          <p className="mt-1 text-xl font-black tracking-[-0.03em] text-[#022c22]">{isLoading ? '...' : value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#d2f2e7] text-[#007a55]">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function AnalyticsCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card className="border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-black tracking-[-0.03em] text-[#022c22]">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function RevenueBarChart({ data }: { data: Array<{ label: string; displayLabel: string; value: number; orderCount: number }> }) {
  if (data.length === 0) return <EmptyChart />

  const max = Math.max(...data.map((item) => item.value), 0)
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const best = data.reduce((currentBest, item) => item.value > currentBest.value ? item : currentBest, data[0])

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-[#f5f5f5] p-4">
      <div className="flex h-[360px] items-end gap-2 overflow-x-auto rounded-xl bg-white p-4">
        {data.map((item) => {
          const percent = max > 0 ? Math.max((item.value / max) * 85, item.value > 0 ? 8 : 2) : 2
          const isBest = item.label === best.label && item.value > 0
          return (
            <div key={item.label} className="flex h-full min-w-14 flex-1 flex-col justify-end gap-2">
              <div className="group flex flex-1 items-end">
                <div
                  className={cn(
                    'relative w-full rounded-t-lg transition-colors',
                    isBest ? 'bg-[#007a55]' : item.value > 0 ? 'bg-[#00bc7d]' : 'bg-[#e5e7eb]',
                  )}
                  style={{ height: `${percent}%` }}
                >
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#022c22] px-2 py-1 text-xs text-white group-hover:block">
                    {item.displayLabel}: {currency.format(item.value)} · {item.orderCount} đơn
                  </div>
                </div>
              </div>
              <p className={cn('truncate text-center text-xs', isBest ? 'font-bold text-[#007a55]' : 'text-[#71717a]')}>
                {item.displayLabel}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DonutBreakdown({ data }: { data: Array<{ label: string; value: number; color: string }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const first = data[0]
  const second = data[1]
  const firstPercent = total > 0 ? Math.round((first.value / total) * 100) : 0

  return (
    <div className="flex h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-[#e5e7eb] bg-[#f5f5f5]">
      <div
        className="grid h-44 w-44 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${first.color} 0 ${firstPercent}%, ${second?.color ?? '#e5e7eb'} ${firstPercent}% 100%)`,
        }}
      >
        <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center">
          <div>
            <p className="text-2xl font-black text-[#022c22]">{firstPercent}%</p>
            <p className="text-xs text-[#71717a]">{first.label}</p>
          </div>
        </div>
      </div>
      <p className="text-sm font-bold text-[#007a55]">{currency.format(total)}</p>
    </div>
  )
}

function BarChartLite({ data }: { data: Array<{ label: string; value: number; helper?: string }> }) {
  if (data.length === 0) return <EmptyChart />
  const max = Math.max(...data.map((item) => item.value), 0)

  return (
    <div className="flex h-[280px] items-end gap-2 overflow-x-auto rounded-xl border border-[#e5e7eb] bg-[#f5f5f5] p-4">
      {data.map((item) => {
        const percent = max > 0 ? Math.max((item.value / max) * 85, 4) : 4
        return (
          <div key={item.label} className="flex h-full min-w-10 flex-1 flex-col justify-end gap-2">
            <div className="group flex flex-1 items-end">
              <div
                className="relative w-full rounded-t-lg bg-[#00bc7d] transition-colors group-hover:bg-[#007a55]"
                style={{ height: `${percent}%` }}
              >
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#022c22] px-2 py-1 text-xs text-white group-hover:block">
                  {currency.format(item.value)} · {item.helper}
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-[#71717a]">{item.label}</p>
          </div>
        )
      })}
    </div>
  )
}

function HorizontalBarChartLite({ data }: { data: Array<{ label: string; value: number; color: string }> }) {
  const max = Math.max(...data.map((item) => item.value), 0)

  return (
    <div className="h-[280px] space-y-3 overflow-y-auto rounded-xl border border-[#e5e7eb] bg-[#f5f5f5] p-4">
      {data.map((item) => {
        const percent = max > 0 ? Math.max((item.value / max) * 100, 3) : 3
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-bold text-[#022c22]">{item.label}</span>
              <span className="shrink-0 text-xs font-bold text-[#007a55]">{currency.format(item.value)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full" style={{ width: `${percent}%`, background: item.color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LegendList({ items }: { items: Array<{ label: string; value: string; color: string }> }) {
  return (
    <div className="mt-2 space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-[#71717a]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
            {item.label}
          </span>
          <span className="font-bold text-[#022c22]">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] text-sm text-[#71717a]">
      Chưa có dữ liệu trong khoảng thời gian này.
    </div>
  )
}

function MiniStat({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-[#f5f5f5] p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-[#71717a]">{label}</p>
      <p className={cn('mt-1 text-2xl font-black', danger ? 'text-red-600' : 'text-[#022c22]')}>{value}</p>
    </div>
  )
}

function buildStaffPerformance(shifts: ShiftSummary[]) {
  const map = new Map<string, { staffName: string; shiftCount: number; orderCount: number; revenue: number }>()

  shifts.forEach((shift) => {
    const current = map.get(shift.staffName) ?? {
      staffName: shift.staffName,
      shiftCount: 0,
      orderCount: 0,
      revenue: 0,
    }
    current.shiftCount += 1
    current.orderCount += Number(shift.orderCount) || 0
    current.revenue += Number(shift.revenue) || 0
    map.set(shift.staffName, current)
  })

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      averageRevenuePerShift: item.shiftCount > 0 ? item.revenue / item.shiftCount : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

function compactMoney(value: number) {
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}tr`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(value)
}

function cancelRate(cancelled: number, completed: number) {
  const total = cancelled + completed
  if (total <= 0) return 0
  return Math.round((cancelled / total) * 100)
}

function normalizeRevenueSeries(
  rawData: RevenueDataPoint[],
  fromDate: string,
  toDate: string,
  groupBy: 'DAY' | 'WEEK' | 'MONTH',
) {
  const rawMap = new Map<string, RevenueDataPoint>()

  rawData.forEach((item) => {
    const key = normalizeRevenueLabel(item.label, groupBy)
    rawMap.set(key, item)
  })

  if (groupBy === 'MONTH') {
    return getMonthsInRange(fromDate, toDate).map((monthKey) => {
      const item = rawMap.get(monthKey)
      return {
        label: monthKey,
        displayLabel: formatMonthLabel(monthKey),
        value: Number(item?.revenue ?? 0),
        orderCount: Number(item?.orderCount ?? 0),
      }
    })
  }

  if (groupBy === 'WEEK') {
    return getWeeksInRange(fromDate, toDate).map((weekKey) => {
      const item = rawMap.get(weekKey)
      return {
        label: weekKey,
        displayLabel: `Tuần ${formatDayMonth(weekKey)}`,
        value: Number(item?.revenue ?? 0),
        orderCount: Number(item?.orderCount ?? 0),
      }
    })
  }

  return getDaysInRange(fromDate, toDate).map((dayKey) => {
    const item = rawMap.get(dayKey)
    return {
      label: dayKey,
      displayLabel: formatDayMonth(dayKey),
      value: Number(item?.revenue ?? 0),
      orderCount: Number(item?.orderCount ?? 0),
    }
  })
}

function normalizeRevenueLabel(label: string, groupBy: 'DAY' | 'WEEK' | 'MONTH') {
  if (groupBy === 'MONTH') {
    const monthMatch = label.match(/\d{4}-\d{2}/)
    return monthMatch?.[0] ?? label
  }

  const dayMatch = label.match(/\d{4}-\d{2}-\d{2}/)
  if (!dayMatch) return label

  if (groupBy === 'WEEK') {
    return getWeekStartKey(dayMatch[0])
  }

  return dayMatch[0]
}

function getDaysInRange(fromDate: string, toDate: string) {
  const result: string[] = []
  const cursor = new Date(`${fromDate}T00:00:00`)
  const end = new Date(`${toDate}T00:00:00`)

  while (cursor <= end) {
    result.push(toDateValue(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

function getWeeksInRange(fromDate: string, toDate: string) {
  const result: string[] = []
  const cursor = new Date(`${getWeekStartKey(fromDate)}T00:00:00`)
  const end = new Date(`${toDate}T00:00:00`)

  while (cursor <= end) {
    result.push(toDateValue(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }

  return result
}

function getMonthsInRange(fromDate: string, toDate: string) {
  const result: string[] = []
  const cursor = new Date(`${fromDate}T00:00:00`)
  cursor.setDate(1)
  const end = new Date(`${toDate}T00:00:00`)

  while (cursor <= end) {
    result.push(toDateValue(cursor).slice(0, 7))
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return result
}

function getWeekStartKey(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`)
  const day = date.getDay() === 0 ? 7 : date.getDay()
  date.setDate(date.getDate() - day + 1)
  return toDateValue(date)
}

function formatDayMonth(value: string) {
  const parts = value.split('-')
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : value
}

function formatMonthLabel(value: string) {
  const parts = value.split('-')
  return parts.length === 2 ? `${parts[1]}/${parts[0]}` : value
}
