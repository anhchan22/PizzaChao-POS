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

  const activeShift = currentShiftQuery.data?.data ?? null

  const dashboardQuery = useQuery({
    queryKey: ['report-dashboard', activeShift?.id],
    queryFn: () => reportApi.getDashboard({ shiftId: activeShift!.id }),
    enabled: Boolean(activeShift),
  })

  const recentOrdersQuery = useQuery({
    queryKey: ['recent-orders', activeShift?.id],
    queryFn: () => orderApi.getAll({
      status: 'ALL',
      shiftId: activeShift!.id,
      page: 0,
      size: 6,
    }),
    enabled: Boolean(activeShift),
    refetchInterval: 15_000,
  })

  const inventoryQuery = useQuery({
    queryKey: ['inventory-items', 'close-shift'],
    queryFn: () => inventoryApi.getAll({ active: true }),
    enabled: closeDialog,
  })

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
      await queryClient.invalidateQueries({ queryKey: ['report-dashboard'] })
      await queryClient.invalidateQueries({ queryKey: ['recent-orders'] })
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

  const fillExpectedInventoryCounts = () => {
    const items = inventoryQuery.data?.data ?? []
    const nextCounts = items.reduce<Record<number, string>>((acc, item) => {
      acc[item.id] = String(item.estimatedRemaining)
      return acc
    }, {})
    setInventoryCounts(nextCounts)
  }

  return (
    <div className="min-h-[calc(100vh-1.5rem)] rounded-2xl bg-[#d2f2e7] p-1.5 text-[#022c22] sm:p-4">
      <div className="w-full space-y-1.5 sm:space-y-3">
        <section className="grid w-full gap-1.5 sm:gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(360px,0.9fr)]">
          <Card className={cn(
            'overflow-hidden border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] pt-0 rounded-xl',
            activeShift ? 'ring-1 ring-emerald-200' : 'ring-1 ring-amber-200',
          )}>
            <CardHeader className="border-b border-[#e5e7eb] bg-gradient-to-br from-[#d2f2e7] to-white p-1.5 sm:p-3">
              <div className="flex items-center gap-1.5">
                <Store className="h-4 w-4 sm:h-5 sm:w-5 text-[#007a55]" />
                <span className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px] font-bold',
                  activeShift
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700',
                )}>
                  {activeShift ? 'Đang mở ca' : 'Chưa mở ca'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-1.5 sm:p-3">
              {currentShiftQuery.isLoading ? (
                <div className="flex items-center gap-1.5 py-2 text-xs text-[#71717a]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Đang kiểm tra ca làm việc...
                </div>
              ) : currentShiftQuery.isError ? (
                <div className="space-y-1 py-1">
                  <p className="text-xs text-destructive">Không thể tải thông tin ca làm việc.</p>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => currentShiftQuery.refetch()}>
                    Thử lại
                  </Button>
                </div>
              ) : activeShift ? (
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5 xl:grid-cols-4">
                  <ShiftInfo label="Người mở ca" value={activeShift.openedByName} />
                  <ShiftInfo label="Mở lúc" value={new Date(activeShift.openedAt).toLocaleString('vi-VN')} />
                  <ShiftInfo label="Đã chạy" value={activeShiftDuration ?? '—'} />
                  <ShiftInfo label="Tiền đầu ca" value={currency.format(activeShift.startingCash)} />
                  <ShiftInfo label="Tổng tiền mặt" value={currency.format(activeShift.expectedCash)} highlight />
                  <ShiftInfo label="Tiền mặt trong ca" value={currency.format(dashData?.cashRevenue ?? 0)} />
                  <ShiftInfo label="Tiền chuyển khoản" value={currency.format(dashData?.transferRevenue ?? 0)} />
                  <ShiftInfo label="Số đơn" value={String(dashData?.todayOrders ?? 0)} />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                  Mở ca và nhập tiền mặt đầu ca trước khi sử dụng máy POS. Nếu chưa mở ca, nhân viên sẽ không thể tạo đơn.
                </div>
              )}
              {activeShift?.openingNote && (
                <p className="mt-2 rounded-lg border border-[#e5e7eb] bg-[#f5f5f5] p-2 text-xs text-[#71717a]">
                  Ghi chú đầu ca: {activeShift.openingNote}
                </p>
              )}
            </CardContent>
            <CardFooter className="border-t border-[#e5e7eb] bg-white p-1.5 sm:p-3">
              {activeShift ? (
                <div className="flex w-full flex-wrap gap-1">
                  <Button className="h-7 sm:h-9 rounded-full bg-[#00bc7d] px-3.5 text-xs text-white hover:bg-[#007a55] sm:text-sm" onClick={() => navigate('/pos')}>
                    Vào máy POS <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                  <Button
                    variant="destructive"
                    className="h-7 sm:h-9 rounded-full px-3.5 text-xs sm:text-sm"
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
                  className="h-8 sm:h-9 rounded-full bg-[#00bc7d] px-3.5 text-xs text-white hover:bg-[#007a55] sm:text-sm"
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

        <section className="grid grid-cols-3 gap-1 md:gap-3 xl:grid-cols-4">
          <OperationMetric
            title="Tổng thu trong ca"
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
          <div className="col-span-3 sm:col-span-1">
            <OperationMetric
              title="Số đơn hàng"
              value={dashboardQuery.isLoading ? '...' : String(dashData?.todayOrders ?? 0)}
              icon={ShoppingCart}
              tone="blue"
            />
          </div>
        </section>

        <section className="grid w-full gap-2.5 md:gap-4 xl:grid-cols-2">
          <Card className="border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-xl">
            <CardHeader className="p-2.5 md:p-5 pb-1 md:pb-2.5">
              <CardTitle className="flex items-center gap-1.5 text-xs md:text-xl font-black tracking-[-0.03em] text-[#022c22]">
                <PackageSearch className="h-4 w-4 md:h-5 md:w-5 text-[#007a55]" />
                Top món bán chạy trong ca
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 pt-0 md:p-5 md:pt-0 space-y-1.5 md:space-y-2">
              {dashboardQuery.isLoading ? (
                <LoadingLine text="Đang tải top món..." />
              ) : topProducts.length === 0 ? (
                <EmptyLine text="Ca này chưa có món nào được bán." />
              ) : (
                topProducts.slice(0, 6).map((product, index) => (
                  <div key={`${product.productName}-${index}`} className="flex items-center justify-between rounded-lg md:rounded-xl border border-[#e5e7eb] bg-[#f5f5f5] px-2.5 py-1.5 md:px-3 md:py-2">
                    <div className="flex min-w-0 items-center gap-2 md:gap-3">
                      <span className="grid h-6 w-6 md:h-7 md:w-7 shrink-0 place-items-center rounded-full bg-white text-[10px] md:text-xs font-black text-[#007a55]">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs md:text-sm font-bold text-[#022c22]">{product.productName}</p>
                        <p className="text-[10px] md:text-xs text-[#71717a]">{currency.format(product.revenue)}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs font-bold text-[#007a55]">
                      {product.quantitySold} món
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-xl">
            <CardHeader className="p-2.5 md:p-5 pb-1 md:pb-2.5">
              <CardTitle className="flex items-center gap-1.5 text-xs md:text-xl font-black tracking-[-0.03em] text-[#022c22]">
                <Clock3 className="h-4 w-4 md:h-5 md:w-5 text-[#007a55]" />
                Hoạt động gần đây
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 pt-0 md:p-5 md:pt-0 space-y-1.5 md:space-y-2">
              {recentOrdersQuery.isLoading ? (
                <LoadingLine text="Đang tải đơn gần đây..." />
              ) : recentOrders.length === 0 ? (
                <EmptyLine text="Ca này chưa có đơn hàng nào." />
              ) : (
                recentOrders.map((order) => (
                  <RecentOrderRow key={order.id} order={order} />
                ))
              )}
            </CardContent>
            <CardFooter className="p-2.5 pt-0 md:p-5 md:pt-0 justify-end border-t border-[#e5e7eb] pt-2 md:pt-3">
              <Button variant="outline" className="rounded-full h-7 text-xs px-2.5" size="sm" onClick={() => navigate('/admin/orders')}>
                Xem hàng đợi đơn <ArrowRight className="ml-1 h-3 w-3" />
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
        <DialogContent className="max-h-[92vh] overflow-y-auto p-3 sm:p-6 sm:max-w-[760px] rounded-2xl">
          <DialogHeader><DialogTitle className="text-sm md:text-lg">Đóng ca và đối soát tiền</DialogTitle></DialogHeader>
          <div className="space-y-2.5 py-1 md:space-y-4 md:py-3">
            <div className="rounded-lg bg-muted p-2 md:p-4 text-[11px] md:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tiền đầu ca</span>
                <span className="font-medium">{currency.format(activeShift?.startingCash ?? 0)}</span>
              </div>
              <div className="mt-1 md:mt-2 flex justify-between">
                <span className="text-muted-foreground">Tiền dự kiến</span>
                <span className="font-semibold">{currency.format(activeShift?.expectedCash ?? 0)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="actualCash" className="text-[11px] md:text-sm">Tiền mặt thực tế cuối ca (VNĐ)</Label>
              <Input
                id="actualCash"
                type="number"
                min="0"
                step="1000"
                value={actualCash}
                onChange={(event) => setActualCash(event.target.value)}
                className="h-8 md:h-10 text-[11px] md:text-sm"
              />
            </div>
            {actualCash && Number.isFinite(parsedActualCash) && (
              <div className={`rounded-md border p-2 text-xs ${cashDifference === 0 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
                <div className="flex justify-between">
                  <span>Chênh lệch</span>
                  <span className="font-semibold">{currency.format(cashDifference)}</span>
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="closingNote" className="text-[11px] md:text-sm">
                Ghi chú đóng ca {cashDifference !== 0 ? '(bắt buộc khi có chênh lệch)' : ''}
              </Label>
              <Textarea
                id="closingNote"
                maxLength={500}
                value={closingNote}
                onChange={(event) => setClosingNote(event.target.value)}
                className="min-h-10 md:min-h-16 text-[11px] md:text-sm"
              />
            </div>
            <div className="space-y-2 rounded-lg border p-2 md:p-3">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <div>
                  <Label className="text-[11px] md:text-sm font-bold">Kiểm kê vật tư cuối ca</Label>
                  {/* <p className="mt-0.5 text-[9px] md:text-xs text-muted-foreground">
                    Có thể điền nhanh theo số dự kiến rồi chỉnh lại dòng nào cần.
                  </p> */}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] px-2 rounded-full"
                  disabled={inventoryQuery.isLoading || (inventoryQuery.data?.data ?? []).length === 0}
                  onClick={fillExpectedInventoryCounts}
                >
                  Điền theo dự kiến
                </Button>
              </div>
              {inventoryQuery.isLoading ? (
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải vật tư...
                </div>
              ) : (inventoryQuery.data?.data ?? []).length === 0 ? (
                <p className="rounded-md border border-dashed p-3 text-xs md:text-sm text-muted-foreground">
                  Chưa có vật tư đang theo dõi.
                </p>
              ) : (
                <div className="max-h-52 md:max-h-72 grid grid-cols-2 gap-1.5 md:grid-cols-1 md:gap-2 overflow-y-auto pr-1">
                  {(inventoryQuery.data?.data ?? []).map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-1 rounded-md bg-muted/50 p-1.5 md:grid md:grid-cols-[1fr_80px_60px] md:gap-3 md:p-3 md:items-center"
                    >
                      <div className="min-w-0 flex items-center justify-between gap-1 md:block">
                        <p className="truncate text-[11px] md:text-sm font-semibold">{item.name}</p>
                        <p className="text-[9px] md:text-xs text-muted-foreground whitespace-nowrap">
                          <span className="md:hidden">dk: </span>
                          <span className="hidden md:inline">dự kiến: </span>
                          {item.estimatedRemaining}
                        </p>
                      </div>

                      <div className="contents md:block">
                        <div className="flex items-center gap-1.5 md:contents">
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
                            className="h-7 md:h-10 flex-1 border border-border bg-background/80 text-[10px] md:text-sm px-1.5 shadow-sm focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30"
                          />

                          <div className="text-right md:text-left text-[10px] md:text-sm min-w-[28px] md:min-w-0">
                            <p className="hidden md:block text-xs text-muted-foreground">Chênh lệch</p>
                            <p
                              className={
                                inventoryCounts[item.id] &&
                                Number(inventoryCounts[item.id]) - item.estimatedRemaining !== 0
                                  ? 'font-bold md:font-semibold text-amber-600'
                                  : 'font-bold md:font-semibold text-emerald-600'
                              }
                            >
                              {inventoryCounts[item.id]
                                ? `${Number(inventoryCounts[item.id]) - item.estimatedRemaining >= 0 ? '+' : ''}${Number(inventoryCounts[item.id]) - item.estimatedRemaining}`
                                : '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 border-t pt-3">
            <Button variant="outline" className="h-8 md:h-10 text-[10px] md:text-sm rounded-full px-3.5" onClick={() => setCloseDialog(false)}>Hủy</Button>
            <Button variant="destructive" className="flex-1 h-8 md:h-10 text-[10px] md:text-sm rounded-full font-semibold" onClick={handleCloseShift} disabled={closeShiftMutation.isPending}>
              {closeShiftMutation.isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
              Xác nhận đóng ca
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ShiftInfo({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-[#f5f5f5] px-1.5 py-0.5 sm:p-2.5">
      <p className="text-[9px] md:text-xs text-[#71717a]">{label}</p>
      <p className={cn('mt-0.5 truncate text-[11px] md:text-xs font-black', highlight ? 'text-[#007a55]' : 'text-[#022c22]')}>
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
  title: string;
  value: string;
  icon: typeof Banknote;
  tone: 'emerald' | 'rose' | 'amber' | 'blue';
}) {
  const toneClasses = {
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
  }[tone];

  return (
    <Card className="border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-lg">
      <CardContent className="flex items-center justify-between gap-1 px-1 py-0.5 sm:p-3.5">
        <div className="min-w-0">
          <p className="text-[9px] md:text-xs font-medium uppercase tracking-[0.05em] text-[#71717a] truncate">{title}</p>
          <p className="mt-0.5 text-xs md:text-lg font-black tracking-[-0.03em] text-[#022c22] truncate">{value}</p>
        </div>
        <div className={cn('grid h-7 w-7 md:h-9 md:w-9 shrink-0 place-items-center rounded-full', toneClasses)}>
          <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </div>
      </CardContent>
    </Card>
  );
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
    <Card className="border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-xl">
      <CardHeader className="p-2 md:p-4 pb-1 md:pb-2">
        <CardTitle className="flex items-center gap-1.5 text-xs md:text-lg font-black tracking-[-0.03em] text-[#022c22]">
          <AlertTriangle className={cn('h-4 w-4 md:h-5 md:w-5', hasAlerts ? 'text-amber-600' : 'text-emerald-600')} />
          Cảnh báo vận hành
        </CardTitle>
        <CardDescription className="text-[9px] md:text-xs mt-0.5">Các việc cần chú ý trong ca hôm nay.</CardDescription>
      </CardHeader>
      <CardContent className="p-2 pt-0 md:p-4 md:pt-0 space-y-1.5">
        {!hasActiveShift && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-xs text-amber-800">
            Chưa mở ca bán hàng.
          </div>
        )}
        {lowStockItems.slice(0, 4).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-xs">
            <span className="truncate font-semibold text-amber-900">{item.name}</span>
            <span className="shrink-0 text-[10px] font-bold text-amber-700">
              {item.currentQuantity}/{item.warningQuantity} {item.unit}
            </span>
          </div>
        ))}
        {!hasAlerts && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-xs text-emerald-700">
            <CheckCircle2 className="mr-1 inline h-3 w-3" />
            Không có cảnh báo.
          </div>
        )}
      </CardContent>
      {lowStockItems.length > 0 && (
        <CardFooter className="p-2 pt-0 md:p-4 md:pt-0 justify-end border-t border-[#e5e7eb] pt-2">
          <Button variant="outline" size="sm" className="rounded-full h-7 text-xs px-2.5" onClick={onOpenInventory}>
            Xem kho vật tư <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

function RecentOrderRow({ order }: { order: OrderResponse }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-[#e5e7eb] bg-[#f5f5f5] px-2 py-1 md:px-3 md:py-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs font-black text-[#022c22]">#{order.queueNumber}</span>
          <span className={cn('rounded-full border px-1 py-0.25 text-[9px] md:text-[10px] font-bold', statusClass(order.status))}>
            {statusLabel(order.status)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[10px] md:text-xs text-[#71717a]">
          {order.customerName || 'Khách lẻ'} · {format(new Date(order.createdAt), 'HH:mm')}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs md:text-sm font-black text-[#007a55]">{currency.format(order.totalAmount)}</p>
        <p className="text-[9px] md:text-[10px] text-[#71717a]">
          {order.paymentMethod === 'CASH' ? (
            <span className="inline-flex items-center gap-0.5"><Banknote className="h-2 w-2 md:h-3 md:w-3" />Tiền mặt</span>
          ) : (
            <span className="inline-flex items-center gap-0.5"><CreditCard className="h-2 w-2 md:h-3 md:w-3" />CK</span>
          )}
        </p>
      </div>
    </div>
  )
}

function LoadingLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-dashed border-[#e5e7eb] py-1.5 px-2 md:p-3 text-[11px] md:text-sm text-[#71717a]">
      <Loader2 className="h-3 w-3 animate-spin" />
      {text}
    </div>
  )
}

function EmptyLine({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#e5e7eb] py-1.5 px-2 md:p-3 text-[11px] md:text-sm text-[#71717a]">
      {text}
    </div>
  )
}
