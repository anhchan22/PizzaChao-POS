import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  PackageSearch,
  Receipt,
  ShoppingCart,
  Store,
  TrendingUp,
} from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { orderApi, type OrderResponse, type OrderStatus } from '@/apis/order.api'
import { reportApi } from '@/apis/report.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { inventoryApi } from '@/features/inventory/api/inventory.api'
import { shiftApi } from '@/features/shift/api/shift.api'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    return response?.data?.message ?? fallback
  }
  return fallback
}

function statusLabel(status: OrderStatus) {
  switch (status) {
    case 'PENDING':
      return 'Chờ xử lý'
    case 'PROCESSING':
      return 'Đang chuẩn bị'
    case 'COMPLETED':
      return 'Đã xong'
    case 'CANCELLED':
      return 'Đã hủy'
  }
}

function statusClass(status: OrderStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'CANCELLED':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'PROCESSING':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'PENDING':
      return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [openDialog, setOpenDialog] = useState(false)
  const [closeDialog, setCloseDialog] = useState(false)
  const [startingCash, setStartingCash] = useState('')
  const [actualCash, setActualCash] = useState('')
  const [openingNote, setOpeningNote] = useState('')
  const [closingNote, setClosingNote] = useState('')
  const [inventoryCounts, setInventoryCounts] = useState<Record<number, string>>({})
  const [inventoryNotes, setInventoryNotes] = useState<Record<number, string>>({})

  const currentShiftQuery = useQuery({
    queryKey: ['current-shift'],
    queryFn: shiftApi.getCurrentShift,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  const dashboardQuery = useQuery({
    queryKey: ['report-dashboard', today],
    queryFn: () => reportApi.getDashboard({ date: today }),
  })

  const recentOrdersQuery = useQuery({
    queryKey: ['recent-orders', today],
    queryFn: () => orderApi.getAll({
      status: 'ALL',
      fromDate: today,
      toDate: today,
      page: 0,
      size: 6,
    }),
    refetchInterval: 15_000,
  })

  const inventoryQuery = useQuery({
    queryKey: ['inventory-items', 'close-shift'],
    queryFn: () => inventoryApi.getAll({ active: true }),
    enabled: closeDialog,
  })

  const activeShift = currentShiftQuery.data?.data ?? null
  const dashData = dashboardQuery.data
  const recentOrders = recentOrdersQuery.data?.content ?? []
  const lowStockItems = dashData?.lowStockItems ?? []
  const topProducts = dashData?.topProducts ?? []

  const parsedStartingCash = Number(startingCash)
  const parsedActualCash = Number(actualCash)
  const cashDifference = activeShift && Number.isFinite(parsedActualCash)
    ? parsedActualCash - activeShift.expectedCash
    : 0

  const activeShiftDuration = useMemo(() => {
    if (!activeShift) return null
    const opened = new Date(activeShift.openedAt).getTime()
    const minutes = Math.max(0, Math.floor((Date.now() - opened) / 60_000))
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours === 0) return `${remainingMinutes} phút`
    if (remainingMinutes === 0) return `${hours} giờ`
    return `${hours} giờ ${remainingMinutes} phút`
  }, [activeShift])

  const openShiftMutation = useMutation({
    mutationFn: shiftApi.openShift,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['current-shift'] })
      setOpenDialog(false)
      setStartingCash('')
      setOpeningNote('')
      toast.success('Mở ca thành công')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Không thể mở ca')),
  })

  const closeShiftMutation = useMutation({
    mutationFn: shiftApi.closeShift,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['current-shift'] })
      await queryClient.invalidateQueries({ queryKey: ['shift-history'] })
      await queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      await queryClient.invalidateQueries({ queryKey: ['report-dashboard'] })
      setCloseDialog(false)
      setActualCash('')
      setClosingNote('')
      setInventoryCounts({})
      setInventoryNotes({})
      toast.success('Đóng ca thành công')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Không thể đóng ca')),
  })

  const handleOpenShift = () => {
    if (!startingCash || !Number.isFinite(parsedStartingCash) || parsedStartingCash < 0) {
      toast.error('Vui lòng nhập tiền đầu ca hợp lệ')
      return
    }
    openShiftMutation.mutate({
      startingCash: parsedStartingCash,
      openingNote: openingNote.trim() || undefined,
    })
  }

  const handleCloseShift = () => {
    if (!actualCash || !Number.isFinite(parsedActualCash) || parsedActualCash < 0) {
      toast.error('Vui lòng nhập tiền cuối ca hợp lệ')
      return
    }
    if (cashDifference !== 0 && !closingNote.trim()) {
      toast.error('Vui lòng nhập lý do khi tiền cuối ca bị chênh lệch')
      return
    }
    const invalidInventoryCount = Object.values(inventoryCounts).some((value) =>
      value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0),
    )
    if (invalidInventoryCount) {
      toast.error('Số lượng vật tư cuối ca không hợp lệ')
      return
    }

    closeShiftMutation.mutate({
      actualCash: parsedActualCash,
      closingNote: closingNote.trim() || undefined,
      inventoryCounts: Object.entries(inventoryCounts)
        .filter(([, value]) => value !== '')
        .map(([inventoryItemId, value]) => {
          const id = Number(inventoryItemId)
          return {
            inventoryItemId: id,
            actualQuantity: Number(value),
            note: inventoryNotes[id]?.trim() || undefined,
          }
        }),
    })
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] rounded-2xl bg-[#f5f5f5] p-3 text-[#022c22] sm:p-4">
      <div className="w-full space-y-4">
        <section className="grid w-full gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(360px,0.9fr)]">
          <Card className={cn(
            'overflow-hidden border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
            activeShift ? 'ring-1 ring-emerald-200' : 'ring-1 ring-amber-200',
          )}>
            <CardHeader className="border-b border-[#e5e7eb] bg-gradient-to-br from-[#d2f2e7] to-white pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-[-0.04em] text-[#022c22]">
                    <Store className="h-6 w-6 text-[#007a55]" />
                    Ca làm việc hôm nay
                  </CardTitle>
                  <CardDescription className="mt-1 text-[#71717a]">
                    {activeShift ? 'Ca đang mở, sẵn sàng bán hàng.' : 'Chưa có ca đang mở. Hãy mở ca trước khi bán hàng.'}
                  </CardDescription>
                </div>
                <span className={cn(
                  'rounded-full border px-3 py-1 text-xs font-bold',
                  activeShift
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700',
                )}>
                  {activeShift ? 'Đang mở ca' : 'Chưa mở ca'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {currentShiftQuery.isLoading ? (
                <div className="flex items-center gap-2 py-4 text-sm text-[#71717a]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang kiểm tra ca làm việc...
                </div>
              ) : currentShiftQuery.isError ? (
                <div className="space-y-3 py-2">
                  <p className="text-sm text-destructive">Không thể tải thông tin ca làm việc.</p>
                  <Button variant="outline" size="sm" onClick={() => currentShiftQuery.refetch()}>
                    Thử lại
                  </Button>
                </div>
              ) : activeShift ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <ShiftInfo label="Người mở ca" value={activeShift.openedByName} />
                  <ShiftInfo label="Mở lúc" value={new Date(activeShift.openedAt).toLocaleString('vi-VN')} />
                  <ShiftInfo label="Đã chạy" value={activeShiftDuration ?? '—'} />
                  <ShiftInfo label="Tiền đầu ca" value={currency.format(activeShift.startingCash)} />
                  <ShiftInfo label="Tiền mặt dự kiến" value={currency.format(activeShift.expectedCash)} highlight />
                  <ShiftInfo label="Tiền mặt hôm nay" value={currency.format(dashData?.cashRevenue ?? 0)} />
                  <ShiftInfo label="Chuyển khoản hôm nay" value={currency.format(dashData?.transferRevenue ?? 0)} />
                  <ShiftInfo label="Số đơn hôm nay" value={String(dashData?.todayOrders ?? 0)} />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                  Mở ca và nhập tiền mặt đầu ca trước khi sử dụng máy POS. Nếu chưa mở ca, nhân viên sẽ không thể tạo đơn.
                </div>
              )}
              {activeShift?.openingNote && (
                <p className="mt-3 rounded-xl border border-[#e5e7eb] bg-[#f5f5f5] p-3 text-sm text-[#71717a]">
                  Ghi chú đầu ca: {activeShift.openingNote}
                </p>
              )}
            </CardContent>
            <CardFooter className="border-t border-[#e5e7eb] bg-white p-4">
              {activeShift ? (
                <div className="flex w-full flex-wrap gap-2">
                  <Button className="rounded-full bg-[#00bc7d] px-5 text-white hover:bg-[#007a55]" onClick={() => navigate('/pos')}>
                    Vào máy POS <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-full px-5"
                    onClick={() => {
                      setActualCash('')
                      setClosingNote('')
                      setInventoryCounts({})
                      setInventoryNotes({})
                      setCloseDialog(true)
                    }}
                  >
                    Đóng ca
                  </Button>
                </div>
              ) : (
                <Button
                  className="rounded-full bg-[#00bc7d] px-5 text-white hover:bg-[#007a55]"
                  disabled={currentShiftQuery.isLoading || currentShiftQuery.isError}
                  onClick={() => {
                    setStartingCash('')
                    setOpeningNote('')
                    setOpenDialog(true)
                  }}
                >
                  Mở ca bán hàng
                </Button>
              )}
            </CardFooter>
          </Card>

          <AlertsCard
            hasActiveShift={Boolean(activeShift)}
            lowStockItems={lowStockItems}
            onOpenInventory={() => navigate('/admin/inventory')}
          />
        </section>

        <section className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OperationMetric
            title="Tổng thu hôm nay"
            value={dashboardQuery.isLoading ? '...' : currency.format(dashData?.todayRevenue ?? 0)}
            icon={Banknote}
            tone="emerald"
          />
          <OperationMetric
            title="Đã chi"
            value={dashboardQuery.isLoading ? '...' : currency.format(dashData?.todayExpenses ?? 0)}
            icon={Receipt}
            tone="rose"
          />
          <OperationMetric
            title="Lợi nhuận ước tính"
            value={dashboardQuery.isLoading ? '...' : currency.format(dashData?.estimatedProfit ?? 0)}
            icon={TrendingUp}
            tone="amber"
          />
          <OperationMetric
            title="Số đơn hàng"
            value={dashboardQuery.isLoading ? '...' : String(dashData?.todayOrders ?? 0)}
            icon={ShoppingCart}
            tone="blue"
          />
        </section>

        <section className="grid w-full gap-4 xl:grid-cols-2">
          <Card className="border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-black tracking-[-0.03em] text-[#022c22]">
                <PackageSearch className="h-5 w-5 text-[#007a55]" />
                Top món bán chạy hôm nay
              </CardTitle>
              <CardDescription>Giúp bếp và thu ngân nắm món đang hot để chuẩn bị nguyên liệu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboardQuery.isLoading ? (
                <LoadingLine text="Đang tải top món..." />
              ) : topProducts.length === 0 ? (
                <EmptyLine text="Hôm nay chưa có món nào được bán." />
              ) : (
                topProducts.slice(0, 6).map((product, index) => (
                  <div key={`${product.productName}-${index}`} className="flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-[#f5f5f5] px-3 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-[#007a55]">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#022c22]">{product.productName}</p>
                        <p className="text-xs text-[#71717a]">{currency.format(product.revenue)}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#007a55]">
                      {product.quantitySold} món
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-black tracking-[-0.03em] text-[#022c22]">
                <Clock3 className="h-5 w-5 text-[#007a55]" />
                Hoạt động gần đây
              </CardTitle>
              <CardDescription>6 đơn mới nhất trong hôm nay, tự làm mới mỗi 15 giây.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentOrdersQuery.isLoading ? (
                <LoadingLine text="Đang tải đơn gần đây..." />
              ) : recentOrders.length === 0 ? (
                <EmptyLine text="Hôm nay chưa có đơn hàng nào." />
              ) : (
                recentOrders.map((order) => (
                  <RecentOrderRow key={order.id} order={order} />
                ))
              )}
            </CardContent>
            <CardFooter className="justify-end border-t border-[#e5e7eb] pt-3">
              <Button variant="outline" className="rounded-full" size="sm" onClick={() => navigate('/admin/orders')}>
                Xem hàng đợi đơn <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </section>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader><DialogTitle>Mở ca làm việc</DialogTitle></DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="startingCash">Tiền mặt đầu ca (VNĐ)</Label>
              <Input
                id="startingCash"
                type="number"
                min="0"
                step="1000"
                value={startingCash}
                onChange={(event) => setStartingCash(event.target.value)}
                placeholder="Ví dụ: 500000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openingNote">Ghi chú đầu ca</Label>
              <Textarea
                id="openingNote"
                maxLength={500}
                value={openingNote}
                onChange={(event) => setOpeningNote(event.target.value)}
                placeholder="Tùy chọn"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Hủy</Button>
            <Button onClick={handleOpenShift} disabled={openShiftMutation.isPending}>
              {openShiftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận mở ca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[760px]">
          <DialogHeader><DialogTitle>Đóng ca và đối soát tiền</DialogTitle></DialogHeader>
          <div className="space-y-4 py-3">
            <div className="rounded-lg bg-muted p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tiền đầu ca</span>
                <span className="font-medium">{currency.format(activeShift?.startingCash ?? 0)}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-muted-foreground">Tiền dự kiến</span>
                <span className="font-semibold">{currency.format(activeShift?.expectedCash ?? 0)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualCash">Tiền mặt thực tế cuối ca (VNĐ)</Label>
              <Input
                id="actualCash"
                type="number"
                min="0"
                step="1000"
                value={actualCash}
                onChange={(event) => setActualCash(event.target.value)}
              />
            </div>
            {actualCash && Number.isFinite(parsedActualCash) && (
              <div className={`rounded-lg border p-3 text-sm ${cashDifference === 0 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
                <div className="flex justify-between">
                  <span>Chênh lệch</span>
                  <span className="font-semibold">{currency.format(cashDifference)}</span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="closingNote">
                Ghi chú đóng ca {cashDifference !== 0 ? '(bắt buộc khi có chênh lệch)' : ''}
              </Label>
              <Textarea
                id="closingNote"
                maxLength={500}
                value={closingNote}
                onChange={(event) => setClosingNote(event.target.value)}
              />
            </div>
            <div className="space-y-3 rounded-lg border p-3">
              <div>
                <Label>Kiểm kê vật tư cuối ca</Label>
              </div>
              {inventoryQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải vật tư...
                </div>
              ) : (inventoryQuery.data?.data ?? []).length === 0 ? (
                <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  Chưa có vật tư đang theo dõi.
                </p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {(inventoryQuery.data?.data ?? []).map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-3 rounded-md bg-muted/50 p-3 md:grid-cols-3 md:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{item.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          dự kiến: <span>{item.estimatedRemaining}</span>
                        </p>
                      </div>

                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={inventoryCounts[item.id] ?? ''}
                        onChange={(event) =>
                          setInventoryCounts((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                        className="h-10 border border-border bg-background/80 text-sm shadow-sm focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30"
                      />

                      <div className="text-sm">
                        <p className="text-xs text-muted-foreground">Chênh lệch</p>
                        <p
                          className={
                            inventoryCounts[item.id] &&
                            Number(inventoryCounts[item.id]) - item.estimatedRemaining !== 0
                              ? 'font-semibold text-amber-600'
                              : 'font-semibold text-emerald-600'
                          }
                        >
                          {inventoryCounts[item.id]
                            ? Number(inventoryCounts[item.id]) - item.estimatedRemaining
                            : '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleCloseShift} disabled={closeShiftMutation.isPending}>
              {closeShiftMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận đóng ca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ShiftInfo({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-[#f5f5f5] p-3">
      <p className="text-xs text-[#71717a]">{label}</p>
      <p className={cn('mt-1 truncate text-sm font-black', highlight ? 'text-[#007a55]' : 'text-[#022c22]')}>
        {value}
      </p>
    </div>
  )
}

function OperationMetric({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string
  value: string
  icon: typeof Banknote
  tone: 'emerald' | 'rose' | 'amber' | 'blue'
}) {
  const toneClasses = {
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
  }[tone]

  return (
    <Card className="border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#71717a]">{title}</p>
          <p className="mt-1 text-xl font-black tracking-[-0.03em] text-[#022c22]">{value}</p>
        </div>
        <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full', toneClasses)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function AlertsCard({
  hasActiveShift,
  lowStockItems,
  onOpenInventory,
}: {
  hasActiveShift: boolean
  lowStockItems: Array<{ id: number; name: string; unit: string; currentQuantity: number; warningQuantity: number }>
  onOpenInventory: () => void
}) {
  const hasAlerts = !hasActiveShift || lowStockItems.length > 0

  return (
    <Card className="border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-[-0.03em] text-[#022c22]">
          <AlertTriangle className={cn('h-5 w-5', hasAlerts ? 'text-amber-600' : 'text-emerald-600')} />
          Cảnh báo vận hành
        </CardTitle>
        <CardDescription>Các việc cần chú ý trong ca hôm nay.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {!hasActiveShift && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Chưa mở ca bán hàng.
          </div>
        )}
        {lowStockItems.slice(0, 4).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
            <span className="truncate font-semibold text-amber-900">{item.name}</span>
            <span className="shrink-0 text-xs font-bold text-amber-700">
              {item.currentQuantity}/{item.warningQuantity} {item.unit}
            </span>
          </div>
        ))}
        {!hasAlerts && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            Không có cảnh báo quan trọng.
          </div>
        )}
      </CardContent>
      {lowStockItems.length > 0 && (
        <CardFooter className="justify-end border-t border-[#e5e7eb] pt-3">
          <Button variant="outline" size="sm" className="rounded-full" onClick={onOpenInventory}>
            Xem kho vật tư <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

function RecentOrderRow({ order }: { order: OrderResponse }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e5e7eb] bg-[#f5f5f5] px-3 py-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-black text-[#022c22]">#{order.queueNumber}</span>
          <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-bold', statusClass(order.status))}>
            {statusLabel(order.status)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-[#71717a]">
          {order.customerName || 'Khách lẻ'} · {format(new Date(order.createdAt), 'HH:mm')}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-black text-[#007a55]">{currency.format(order.totalAmount)}</p>
        <p className="text-[11px] text-[#71717a]">
          {order.paymentMethod === 'CASH' ? (
            <span className="inline-flex items-center gap-1"><Banknote className="h-3 w-3" />Tiền mặt</span>
          ) : (
            <span className="inline-flex items-center gap-1"><CreditCard className="h-3 w-3" />CK</span>
          )}
        </p>
      </div>
    </div>
  )
}

function LoadingLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#e5e7eb] p-4 text-sm text-[#71717a]">
      <Loader2 className="h-4 w-4 animate-spin" />
      {text}
    </div>
  )
}

function EmptyLine({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#e5e7eb] p-4 text-sm text-[#71717a]">
      {text}
    </div>
  )
}
