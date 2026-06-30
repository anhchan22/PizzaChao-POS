import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, DollarSign, Loader2, ShoppingCart, Store, TrendingUp, Receipt, AlertTriangle, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { inventoryApi } from '@/features/inventory/api/inventory.api'
import { shiftApi } from '@/features/shift/api/shift.api'
import { reportApi } from '@/apis/report.api'
import { addMonths, format, isAfter, isBefore, parseISO } from 'date-fns'

import { StatCard } from './components/StatCard'
import { RevenueChart } from './components/RevenueChart'
import { TopProductsChart } from './components/TopProductsChart'
import { HourlySalesChart } from './components/HourlySalesChart'
import { exportToExcel } from '@/lib/excel'

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

export function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Shift Dialog state
  const [openDialog, setOpenDialog] = useState(false)
  const [closeDialog, setCloseDialog] = useState(false)
  const [startingCash, setStartingCash] = useState('')
  const [actualCash, setActualCash] = useState('')
  const [openingNote, setOpeningNote] = useState('')
  const [closingNote, setClosingNote] = useState('')
  const [inventoryCounts, setInventoryCounts] = useState<Record<number, string>>({})
  const [inventoryNotes, setInventoryNotes] = useState<Record<number, string>>({})

  // Dashboard date range state
  const today = format(new Date(), 'yyyy-MM-dd')
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)

  const dateRangeError = useMemo(() => {
    if (!fromDate || !toDate) return 'Vui lòng chọn đủ ngày bắt đầu và ngày kết thúc.'
    const from = parseISO(fromDate)
    const to = parseISO(toDate)
    if (isBefore(to, from)) return 'Ngày kết thúc không được trước ngày bắt đầu.'
    if (isAfter(to, addMonths(from, 1))) return 'Khoảng thời gian báo cáo tối đa là 1 tháng.'
    return ''
  }, [fromDate, toDate])

  const isDateRangeValid = !dateRangeError
  const rangeTitle = !fromDate || !toDate
    ? 'Tổng quan'
    : fromDate === toDate
      ? `Tổng quan ngày ${format(parseISO(fromDate), 'dd/MM/yyyy')}`
      : `Tổng quan từ ${format(parseISO(fromDate), 'dd/MM/yyyy')} đến ${format(parseISO(toDate), 'dd/MM/yyyy')}`

  const handleFromDateChange = (value: string) => {
    setFromDate(value)
    if (value && toDate && isBefore(parseISO(toDate), parseISO(value))) {
      setToDate(value)
    }
  }

  const handleToDateChange = (value: string) => {
    setToDate(value)
    if (!fromDate || !value) return
    const from = parseISO(fromDate)
    const to = parseISO(value)
    if (isBefore(to, from)) {
      toast.error('Ngày kết thúc không được trước ngày bắt đầu.')
    } else if (isAfter(to, addMonths(from, 1))) {
      toast.error('Khoảng thời gian báo cáo tối đa là 1 tháng.')
    }
  }

  // Queries
  const currentShiftQuery = useQuery({
    queryKey: ['current-shift'],
    queryFn: shiftApi.getCurrentShift,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  const inventoryQuery = useQuery({
    queryKey: ['inventory-items', 'close-shift'],
    queryFn: () => inventoryApi.getAll({ active: true }),
    enabled: closeDialog,
  })

  // Report Queries
  const dashboardQuery = useQuery({
    queryKey: ['report-dashboard', fromDate, toDate],
    queryFn: () => reportApi.getDashboard({ from: fromDate, to: toDate }),
    enabled: isDateRangeValid,
  })

  const revenueQuery = useQuery({
    queryKey: ['report-revenue', fromDate, toDate],
    queryFn: () => reportApi.getRevenue({ from: fromDate, to: toDate, groupBy: 'DAY' }),
    enabled: isDateRangeValid,
  })

  const hourlySalesQuery = useQuery({
    queryKey: ['report-hourly', fromDate, toDate],
    queryFn: () => reportApi.getHourlySales({ from: fromDate, to: toDate }),
    enabled: isDateRangeValid,
  })

  // Computed for Shift
  const activeShift = currentShiftQuery.data?.data ?? null
  const parsedStartingCash = Number(startingCash)
  const parsedActualCash = Number(actualCash)
  const cashDifference = activeShift && Number.isFinite(parsedActualCash)
    ? parsedActualCash - activeShift.expectedCash
    : 0

  // Mutations for Shift
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

  const handleExportExcel = () => {
    if (!dashData) {
      toast.error('Chưa có dữ liệu để xuất')
      return
    }

    // Prepare data for export
    const exportData = [
      { 'Chỉ tiêu': 'Doanh thu', 'Giá trị': dashData.todayRevenue },
      { 'Chỉ tiêu': 'Số đơn hàng', 'Giá trị': dashData.todayOrders },
      { 'Chỉ tiêu': 'Tiền mặt', 'Giá trị': dashData.cashRevenue },
      { 'Chỉ tiêu': 'Chuyển khoản', 'Giá trị': dashData.transferRevenue },
      { 'Chỉ tiêu': 'Chi phí', 'Giá trị': dashData.todayExpenses },
      { 'Chỉ tiêu': 'Lợi nhuận ước tính', 'Giá trị': dashData.estimatedProfit },
    ]

    exportToExcel(exportData, `BaoCao_TongQuan_${fromDate}_${toDate}`)
    toast.success('Đã xuất file Excel')
  }

  const dashData = dashboardQuery.data
  const lowStockItems = dashData?.lowStockItems ?? []
  const topProducts = dashData?.topProducts ?? []
  const revenueData = revenueQuery.data ?? []
  const hourlySalesData = hourlySalesQuery.data ?? []

  return (
    <div className="space-y-6 pb-8">
      {/* Shift Panel */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5 text-primary" />
              Ca làm việc của bạn
            </CardTitle>
            <CardDescription>
              {activeShift ? 'Ca đang mở và sẵn sàng bán hàng' : 'Bạn chưa mở ca làm việc'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentShiftQuery.isLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
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
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Người mở ca</span>
                  <span className="font-medium">{activeShift.openedByName}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Thời gian mở</span>
                  <span className="font-medium">{new Date(activeShift.openedAt).toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Tiền đầu ca</span>
                  <span className="font-medium">{currency.format(activeShift.startingCash)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Tiền mặt dự kiến</span>
                  <span className="font-semibold text-primary">{currency.format(activeShift.expectedCash)}</span>
                </div>
                {activeShift.openingNote && (
                  <p className="rounded-md bg-muted p-2 text-muted-foreground">{activeShift.openingNote}</p>
                )}
              </div>
            ) : (
              <p className="py-2 text-sm text-muted-foreground">
                Mở ca và nhập tiền mặt đầu ca trước khi sử dụng máy POS.
              </p>
            )}
          </CardContent>
          <CardFooter className="pt-2">
            {activeShift ? (
              <div className="flex w-full gap-2">
                <Button className="flex-1" onClick={() => navigate('/pos')}>
                  Vào máy POS <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
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
                className="w-full"
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

        {/* Low Stock Warning Panel - only visible if there are warnings */}
        {lowStockItems.length > 0 && (
          <Card className="border-amber-500/50 bg-amber-500/5 shadow-sm lg:col-span-2">
             <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-amber-700 dark:text-amber-500">
                <AlertTriangle className="h-5 w-5" />
                Cảnh báo sắp hết vật tư ({lowStockItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {lowStockItems.slice(0, 4).map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-background rounded p-2 text-sm">
                    <span className="font-medium truncate mr-2">{item.name}</span>
                    <span className="text-amber-600 font-bold whitespace-nowrap">
                      {item.currentQuantity} / {item.warningQuantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-2 flex justify-end">
               <Button variant="link" className="text-amber-700 dark:text-amber-500 p-0" onClick={() => navigate('/admin/inventory')}>
                 Xem tất cả kho <ArrowRight className="ml-1 w-4 h-4" />
               </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-8 mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{rangeTitle}</h2>
          {dateRangeError && <p className="mt-1 text-sm text-destructive">{dateRangeError}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="reportFrom" className="text-xs text-muted-foreground">Từ</Label>
            <Input
              id="reportFrom"
              type="date"
              value={fromDate}
              onChange={(e) => handleFromDateChange(e.target.value)}
              className="h-9 w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="reportTo" className="text-xs text-muted-foreground">Đến</Label>
            <Input
              id="reportTo"
              type="date"
              value={toDate}
              onChange={(e) => handleToDateChange(e.target.value)}
              className="h-9 w-auto"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!dashData}>
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Tiền mặt"
          value={dashboardQuery.isLoading ? '...' : currency.format(dashData?.cashRevenue || 0)}
          icon={DollarSign}
          iconColorClass="text-emerald-600"
          iconBgClass="bg-emerald-100"
          trendValue={12}
        />
        <StatCard
          title="Chuyển khoản"
          value={dashboardQuery.isLoading ? '...' : currency.format(dashData?.transferRevenue || 0)}
          icon={Receipt}
          iconColorClass="text-blue-600"
          iconBgClass="bg-blue-100"
          trendValue={8}
        />
        <StatCard
          title="Tổng đơn hàng"
          value={dashboardQuery.isLoading ? '...' : String(dashData?.todayOrders || 0)}
          icon={ShoppingCart}
          iconColorClass="text-violet-600"
          iconBgClass="bg-violet-100"
          trendValue={5}
        />
        <StatCard
          title="Đã chi"
          value={dashboardQuery.isLoading ? '...' : currency.format(dashData?.todayExpenses || 0)}
          icon={TrendingUp}
          iconColorClass="text-rose-600"
          iconBgClass="bg-rose-100"
          trendValue={-2}
        />
        <StatCard
          title="Lợi nhuận ước tính"
          value={dashboardQuery.isLoading ? '...' : currency.format(dashData?.estimatedProfit || 0)}
          icon={Store}
          iconColorClass="text-amber-600"
          iconBgClass="bg-amber-100"
          trendValue={15}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3 mt-4">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} isLoading={revenueQuery.isLoading} />
        </div>
        <div className="lg:col-span-1">
          <TopProductsChart data={topProducts} />
        </div>
      </div>

      <div className="grid gap-4 mt-4">
        <HourlySalesChart data={hourlySalesData} />
      </div>

      {/* Shift Dialogs (unchanged) */}
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
                          dự kiến:{" "}
                          <span>
                            {item.estimatedRemaining}
                          </span>
                        </p>
                      </div>

                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={inventoryCounts[item.id] ?? ""}
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
                              ? "font-semibold text-amber-600"
                              : "font-semibold text-emerald-600"
                          }
                        >
                          {inventoryCounts[item.id]
                            ? Number(inventoryCounts[item.id]) - item.estimatedRemaining
                            : "—"}
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

