import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  ClipboardList,
  Loader2,
  MoreHorizontal,
  XCircle,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  orderApi,
  type OrderQueueFilter,
  type OrderResponse,
  type OrderStatus,
} from '@/apis/order.api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const tabs: Array<{
  value: OrderQueueFilter
  label: string
  description: string
  icon: typeof Clock3
}> = [
  { value: 'UNFINISHED', label: 'Chưa xong', description: 'Cần chuẩn bị', icon: Clock3 },
  { value: 'COMPLETED', label: 'Đã xong', description: 'Hoàn tất', icon: CheckCircle2 },
  { value: 'CANCELLED', label: 'Đã hủy', description: 'Có lý do hủy', icon: Ban },
  { value: 'ALL', label: 'Tất cả', description: 'Toàn bộ đơn', icon: FileText },
]

function statusLabel(status: OrderStatus) {
  switch (status) {
    case 'PENDING':
      return 'Chờ xử lý'
    case 'PROCESSING':
      return 'Đang chuẩn bị'
    case 'COMPLETED':
      return 'Đã hoàn thành'
    case 'CANCELLED':
      return 'Đã hủy'
  }
}

function statusClasses(status: OrderStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'border-[#10b981]/25 bg-[#d2f2e7] text-[#007a55]'
    case 'CANCELLED':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'PROCESSING':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'PENDING':
      return 'border-[#e5e7eb] bg-white text-[#71717a]'
  }
}

function statusDotClasses(status: OrderStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-[#00bc7d]'
    case 'CANCELLED':
      return 'bg-red-500'
    case 'PROCESSING':
      return 'bg-amber-500'
    case 'PENDING':
      return 'bg-[#c9dbd6]'
  }
}

function statusTone(status: OrderStatus) {
  if (status === 'PROCESSING') return 'from-amber-50 to-white'
  if (status === 'COMPLETED') return 'from-[#d2f2e7]/60 to-white'
  if (status === 'CANCELLED') return 'from-red-50 to-white'
  return 'from-[#f5f5f5] to-white'
}

function paymentLabel(order: OrderResponse) {
  return order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'
}

function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
}: {
  order: OrderResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[#e5e7eb] bg-white text-[#022c22] shadow-[0_1px_2px_rgba(0,0,0,0.05)] sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="pr-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#71717a]">Chi tiết đơn</p>
                <h2 className="mt-0.5 text-lg font-black tracking-[-0.03em] text-[#022c22]">
                  #{order.queueNumber} · {order.orderCode}
                </h2>
              </div>
              <StatusPill status={order.status} />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="grid gap-2 rounded-xl border border-[#e5e7eb] bg-[#f5f5f5] p-3 text-xs sm:grid-cols-2">
            <Info label="Khách hàng" value={order.customerName || 'Khách lẻ'} />
            <Info label="Số điện thoại" value={order.customerPhone || '—'} />
            <Info label="Nhân viên tạo" value={order.createdBy} />
            <Info label="Thời gian tạo" value={format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')} />
            <Info label="Thanh toán" value={paymentLabel(order)} />
            {order.paymentMethod === 'CASH' ? (
              <Info
                label="Khách đưa / tiền thừa"
                value={`${currency.format(order.receivedAmount ?? order.totalAmount)} / ${currency.format(order.changeAmount ?? 0)}`}
              />
            ) : (
              <Info label="Mã chuyển khoản" value={order.paymentReference || '—'} />
            )}
          </div>

          {order.note && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-[#022c22]">
              <p className="font-semibold">Ghi chú đơn</p>
              <p className="mt-1 text-[#3d3d3f]">{order.note}</p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-black tracking-[-0.025em] text-[#022c22]">Món cần chuẩn bị</h3>
            {order.items.map((item) => (
              <div key={item.id} className="rounded-xl border border-[#e5e7eb] bg-white p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[#022c22]">{item.quantity} × {item.productName}</p>
                    <Badge className="mt-1 rounded-full border-[#e5e7eb] bg-white px-2 py-0 text-[10px] text-[#007a55] hover:bg-white">
                      {item.sizeName}
                    </Badge>
                  </div>
                  <p className="text-sm font-black text-[#022c22]">{currency.format(item.totalPrice)}</p>
                </div>
                {item.options.length > 0 && (
                  <p className="mt-1.5 text-xs text-[#71717a]">
                    Topping: {item.options.map((option) => option.optionName).join(', ')}
                  </p>
                )}
                {item.note && <p className="mt-1 text-xs font-semibold text-amber-700">{item.note}</p>}
              </div>
            ))}
          </div>

          {order.cancelReason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs">
              <p className="font-semibold text-red-700">Lý do hủy</p>
              <p className="mt-1 text-[#3d3d3f]">{order.cancelReason}</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-3 text-base font-black">
            <span>Tổng đơn</span>
            <span className="text-[#007a55]">{currency.format(order.totalAmount)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#71717a]">{label}</p>
      <p className="mt-0.5 font-semibold text-[#022c22]">{value}</p>
    </div>
  )
}

function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
      statusClasses(status),
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', statusDotClasses(status))} />
      {statusLabel(status)}
    </span>
  )
}

export default function OrderHistoryPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') as OrderQueueFilter | null
  const [tab, setTab] = useState<OrderQueueFilter>(
    tabs.some((item) => item.value === initialTab) ? initialTab! : 'UNFINISHED',
  )
  const [page, setPage] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cancelOrder, setCancelOrder] = useState<OrderResponse | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const ordersQuery = useQuery({
    queryKey: ['orders', tab, page],
    queryFn: () => orderApi.getAll({
      status: tab,
      page,
      size: 20,
    }),
    refetchInterval: tab === 'UNFINISHED' ? 15_000 : false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    const nextTab = searchParams.get('tab') as OrderQueueFilter | null
    if (nextTab && tabs.some((item) => item.value === nextTab) && nextTab !== tab) {
      setTab(nextTab)
      setPage(0)
    }
  }, [searchParams, tab])

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: number
      status: 'COMPLETED' | 'CANCELLED'
      reason?: string
    }) => orderApi.updateStatus(id, status, reason),
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'COMPLETED' ? 'Đã hoàn thành đơn' : 'Đã hủy đơn')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['current-shift'] })
      setCancelOrder(null)
      setCancelReason('')
    },
    onError: (error: unknown) => {
      const message = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : null
      toast.error(message ?? 'Không thể cập nhật đơn hàng')
    },
  })

  const changeTab = (value: OrderQueueFilter) => {
    setTab(value)
    setPage(0)
    setSearchParams({ tab: value })
  }

  const finishOrder = (order: OrderResponse) => {
    statusMutation.mutate({ id: order.id, status: 'COMPLETED' })
  }

  const confirmCancel = () => {
    if (!cancelOrder) return
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn')
      return
    }
    statusMutation.mutate({
      id: cancelOrder.id,
      status: 'CANCELLED',
      reason: cancelReason.trim(),
    })
  }

  const orders = ordersQuery.data?.content ?? []
  const totalInPage = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
    [orders],
  )

  return (
    <div className="min-h-[calc(100vh-1rem)] rounded-2xl bg-[#d2f2e7] p-3 text-[#022c22] sm:p-4">
      <div className="space-y-3">
        <section className="rounded-2xl border border-[#e5e7eb] bg-white/90 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-black leading-none tracking-[-0.04em] text-[#022c22] sm:text-3xl">
                  <ClipboardList className="h-7 w-7 text-[#007a55]" />
                  Đơn hàng
                </h1>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {tabs.map(({ value, label, description, icon: Icon }) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => changeTab(value)}
                      className={cn(
                        'group flex min-h-12 cursor-pointer items-center gap-2.5 rounded-2xl border p-2 pr-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981]',
                        tab === value
                          ? 'border-[#00bc7d] bg-[#00bc7d] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                          : 'border-[#e5e7eb] bg-white text-[#022c22] hover:border-[#10b981] hover:bg-[#f5f5f5]',
                      )}
                    >
                      <span className={cn(
                        'grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors',
                        tab === value
                          ? 'border-white/20 bg-white/20 text-white'
                          : 'border-[#e5e7eb] bg-[#f5f5f5] text-[#007a55] group-hover:bg-[#d2f2e7]',
                      )}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 overflow-hidden">
                        <span className="block truncate text-sm font-black tracking-[-0.02em]">{label}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {ordersQuery.isLoading ? (
          <div className="flex min-h-40 items-center justify-center rounded-2xl border border-[#e5e7eb] bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-[#007a55]" />
          </div>
        ) : ordersQuery.isError ? (
          <EmptyState
            icon={<XCircle className="h-6 w-6" />}
            title="Không thể tải danh sách đơn"
            description="Có thể backend đang chưa chạy hoặc mạng nội bộ đang chập chờn."
            action={<Button size="sm" className="rounded-full bg-[#00bc7d] px-4 text-white hover:bg-[#007a55]" onClick={() => ordersQuery.refetch()}>Thử lại</Button>}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Clock3 className="h-6 w-6" />}
            title="Không có đơn trong mục này"
            description=""
          />
        ) : (
          <section className={cn(
            "grid gap-3",
            tab === 'UNFINISHED' ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "xl:grid-cols-2"
          )}>
            {orders.map((order) => (
              <article
                key={order.id}
                className={cn(
                  'group overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors duration-200 hover:border-[#10b981]',
                  order.status === 'PROCESSING' && 'border-amber-200',
                )}
              >
                <div className={cn('border-b border-[#e5e7eb] bg-gradient-to-br p-3', statusTone(order.status))}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-2xl font-black leading-none tracking-[-0.04em] text-[#022c22]">
                          #{order.queueNumber}
                        </span>
                        <StatusPill status={order.status} />
                      </div>
                      <p className="mt-1 text-xs font-medium text-[#71717a]">
                        {format(new Date(order.createdAt), 'HH:mm dd/MM')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 text-right">
                        {/* <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#71717a]">Tổng</p> */}
                        <p className="text-sm font-black text-[#007a55]">{currency.format(order.totalAmount)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0 rounded-full border border-[#e5e7eb] bg-white text-[#71717a] shadow-[0_1px_2px_rgba(0,0,0,0.05)] opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 hover:border-[#10b981] hover:text-[#007a55]"
                        onClick={() => {
                          setSelectedOrder(order)
                          setDetailsOpen(true)
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {tab === 'UNFINISHED' && (
                  <div className="space-y-3 p-3">
                    <div className="grid gap-2">
                      {order.items.slice(0, 4).map((item) => (
                        <div key={item.id} className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2">
                          <div className="flex justify-between gap-2 text-xs text-[#022c22]">
                            <span className="font-medium">
                              <strong className="font-black">{item.quantity}×</strong> {item.productName}
                            </span>
                            <span className="rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[10px] font-bold text-[#007a55]">
                              {item.sizeName}
                            </span>
                          </div>
                          {item.options.length > 0 && (
                            <p className="mt-1 text-[11px] leading-4 text-[#71717a]">
                              {item.options.map((option) => option.optionName).join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                      {order.items.length > 4 && (
                      <p className="px-1 text-[11px] font-medium text-[#71717a]">+ {order.items.length - 4} món khác</p>
                      )}
                    </div>

                    {order.note && (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs font-semibold text-amber-700">
                        {order.note}
                      </p>
                    )}

                    {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                      <div className="flex flex-wrap justify-end gap-2 border-t border-[#e5e7eb] pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full border-red-200 px-3 text-xs text-red-700 hover:bg-red-50 hover:text-red-700"
                          onClick={() => {
                            setCancelOrder(order)
                            setCancelReason('')
                          }}
                        >
                          <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          Hủy đơn
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 rounded-full bg-[#00bc7d] px-3 text-xs font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[#007a55]"
                          disabled={statusMutation.isPending}
                          onClick={() => finishOrder(order)}
                        >
                          {statusMutation.isPending ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Xác nhận đã xong
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </section>
        )}

        {(ordersQuery.data?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-[#e5e7eb] px-3 text-xs text-[#022c22] hover:bg-[#f5f5f5]"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            </Button>
            <span className="rounded-full border border-[#e5e7eb] bg-white px-3 py-1 text-xs font-semibold text-[#71717a]">
              Trang {page + 1}/{ordersQuery.data?.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-[#e5e7eb] px-3 text-xs text-[#022c22] hover:bg-[#f5f5f5]"
              disabled={page + 1 >= (ordersQuery.data?.totalPages ?? 1)}
              onClick={() => setPage((current) => current + 1)}
            >
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <OrderDetailsDialog order={selectedOrder} open={detailsOpen} onOpenChange={setDetailsOpen} />

      <Dialog open={cancelOrder !== null} onOpenChange={(open) => !open && setCancelOrder(null)}>
        <DialogContent className="border-[#e5e7eb] bg-white text-[#022c22] sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-[-0.03em]">
              Hủy đơn #{cancelOrder?.queueNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <Label htmlFor="cancel-reason" className="text-[#022c22]">Lý do hủy đơn</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Ví dụ: khách đổi ý, nhập nhầm món..."
              className="min-h-24 rounded-xl border-[#e5e7eb] bg-[#f5f5f5] text-sm text-[#022c22] placeholder:text-[#71717a] focus-visible:ring-[#10b981]"
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-[#e5e7eb] px-4 text-[#022c22] hover:bg-[#f5f5f5]"
              onClick={() => setCancelOrder(null)}
            >
              Không hủy
            </Button>
            <Button
              size="sm"
              className="rounded-full bg-red-600 px-4 text-white hover:bg-red-700"
              disabled={statusMutation.isPending}
              onClick={confirmCancel}
            >
              {statusMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <section className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-[#e5e7eb] bg-white p-5 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="grid h-10 w-10 place-items-center rounded-full border border-[#e5e7eb] bg-[#f5f5f5] text-[#007a55]">
        {icon}
      </div>
      <h2 className="mt-3 text-base font-black tracking-[-0.03em] text-[#022c22]">{title}</h2>
      <p className="mt-1 max-w-md text-xs leading-5 text-[#71717a]">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </section>
  )
}
