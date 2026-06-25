import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Ban,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Loader2,
  Search,
  XCircle,
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
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  icon: typeof Clock3
}> = [
  { value: 'UNFINISHED', label: 'Chưa xong', icon: Clock3 },
  { value: 'COMPLETED', label: 'Đã xong', icon: CheckCircle2 },
  { value: 'CANCELLED', label: 'Đã hủy', icon: Ban },
  { value: 'ALL', label: 'Tất cả', icon: FileText },
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

function statusVariant(status: OrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'COMPLETED') return 'default'
  if (status === 'CANCELLED') return 'destructive'
  if (status === 'PROCESSING') return 'secondary'
  return 'outline'
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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3 pr-8">
            <span>Đơn #{order.queueNumber} · {order.orderCode}</span>
            <Badge variant={statusVariant(order.status)}>{statusLabel(order.status)}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid gap-3 rounded-xl bg-muted p-4 text-sm sm:grid-cols-2">
            <Info label="Khách hàng" value={order.customerName || 'Khách lẻ'} />
            <Info label="Số điện thoại" value={order.customerPhone || '—'} />
            <Info label="Nhân viên tạo" value={order.createdBy} />
            <Info label="Thời gian tạo" value={format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')} />
          </div>

          {order.note && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <p className="font-semibold">Ghi chú đơn</p>
              <p className="mt-1">{order.note}</p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-bold">Món cần chuẩn bị</h3>
            {order.items.map((item) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-bold">{item.quantity} × {item.productName}</p>
                    <Badge variant="outline" className="mt-1">{item.sizeName}</Badge>
                  </div>
                  <p className="font-bold">{currency.format(item.totalPrice)}</p>
                </div>
                {item.options.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Topping: {item.options.map((option) => option.optionName).join(', ')}
                  </p>
                )}
                {item.note && <p className="mt-1 text-sm font-medium text-amber-600">{item.note}</p>}
              </div>
            ))}
          </div>

          {order.cancelReason && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
              <p className="font-semibold text-destructive">Lý do hủy</p>
              <p className="mt-1">{order.cancelReason}</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4 text-lg font-black">
            <span>Tổng đơn</span>
            <span className="text-primary">{currency.format(order.totalAmount)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}

export default function OrderHistoryPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') as OrderQueueFilter | null
  const [tab, setTab] = useState<OrderQueueFilter>(
    tabs.some((item) => item.value === initialTab) ? initialTab! : 'UNFINISHED',
  )
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cancelOrder, setCancelOrder] = useState<OrderResponse | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const ordersQuery = useQuery({
    queryKey: ['orders', tab, keyword, page],
    queryFn: () => orderApi.getAll({
      keyword: keyword.trim() || undefined,
      status: tab,
      page,
      size: 20,
    }),
    refetchInterval: tab === 'UNFINISHED' ? 15_000 : false,
  })

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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <FileText className="h-6 w-6 text-primary" />
          Hàng đợi đơn hàng
        </h1>
        <p className="mt-1 text-muted-foreground">
          Đơn mới thanh toán sẽ xuất hiện ở mục Chưa xong để nhân viên chuẩn bị.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tabs.map(({ value, label, icon: Icon }) => (
          <button
            type="button"
            key={value}
            onClick={() => changeTab(value)}
            className={cn(
              'flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 text-left transition-colors',
              tab === value
                ? 'border-primary bg-primary text-primary-foreground shadow-md'
                : 'border-border bg-card hover:border-primary/50',
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="font-bold">{label}</span>
          </button>
        ))}
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value)
            setPage(0)
          }}
          className="h-12 pl-11"
          placeholder="Tìm mã đơn, tên hoặc số điện thoại khách..."
        />
      </div>

      {ordersQuery.isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : ordersQuery.isError ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3">
            <p className="text-destructive">Không thể tải danh sách đơn.</p>
            <Button variant="outline" onClick={() => ordersQuery.refetch()}>Thử lại</Button>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-muted-foreground">
            <Clock3 className="mb-3 h-12 w-12 opacity-40" />
            <p>Không có đơn hàng trong mục này.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {orders.map((order) => (
            <Card
              key={order.id}
              className={cn(
                'overflow-hidden border-2',
                order.status === 'PROCESSING' && 'border-amber-500/40',
              )}
            >
              <CardContent className="p-0">
                <div className="flex items-start justify-between border-b bg-muted/30 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-primary">#{order.queueNumber}</span>
                      <Badge variant={statusVariant(order.status)}>{statusLabel(order.status)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.orderCode} · {format(new Date(order.createdAt), 'HH:mm dd/MM')}
                    </p>
                  </div>
                  <p className="text-lg font-black">{currency.format(order.totalAmount)}</p>
                </div>

                <div className="space-y-3 p-4">
                  <div className="space-y-2">
                    {order.items.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex justify-between gap-3 text-sm">
                        <span>
                          <strong>{item.quantity}×</strong> {item.productName} · {item.sizeName}
                          {item.options.length > 0 && (
                            <span className="block pl-5 text-xs text-muted-foreground">
                              {item.options.map((option) => option.optionName).join(', ')}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <p className="text-xs text-muted-foreground">+ {order.items.length - 4} món khác</p>
                    )}
                  </div>

                  {order.note && (
                    <p className="rounded-lg bg-amber-500/10 p-2 text-sm font-medium text-amber-700">
                      {order.note}
                    </p>
                  )}

                  <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedOrder(order)
                        setDetailsOpen(true)
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Chi tiết
                    </Button>
                    {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                      <>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setCancelOrder(order)
                            setCancelReason('')
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Hủy đơn
                        </Button>
                        <Button
                          className="font-bold"
                          disabled={statusMutation.isPending}
                          onClick={() => finishOrder(order)}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Xác nhận đã xong
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(ordersQuery.data?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Trang trước
          </Button>
          <span className="text-sm">
            Trang {page + 1}/{ordersQuery.data?.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page + 1 >= (ordersQuery.data?.totalPages ?? 1)}
            onClick={() => setPage((current) => current + 1)}
          >
            Trang sau
          </Button>
        </div>
      )}

      <OrderDetailsDialog order={selectedOrder} open={detailsOpen} onOpenChange={setDetailsOpen} />

      <Dialog open={cancelOrder !== null} onOpenChange={(open) => !open && setCancelOrder(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Hủy đơn #{cancelOrder?.queueNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="cancel-reason">Lý do hủy đơn</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Ví dụ: khách đổi ý, nhập nhầm món..."
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOrder(null)}>Không hủy</Button>
            <Button
              variant="destructive"
              disabled={statusMutation.isPending}
              onClick={confirmCancel}
            >
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
