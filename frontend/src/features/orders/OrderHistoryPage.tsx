import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderApi } from '@/apis/order.api'
import type { OrderResponse } from '@/apis/order.api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Search, Eye, XCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

function OrderDetailsDialog({ order, open, onOpenChange }: { order: OrderResponse | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="flex items-center justify-between">
            <span>Chi tiết đơn hàng {order.orderCode}</span>
            <Badge variant={order.status === 'COMPLETED' ? 'default' : order.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
              {order.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Khách hàng</p>
              <p className="font-medium">{order.customerName || 'Khách lẻ'} - {order.customerPhone || 'Không có SĐT'}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Thời gian tạo</p>
              <p className="font-medium">{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Nhân viên tạo</p>
              <p className="font-medium">{order.createdBy}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Phương thức TT</p>
              <p className="font-medium">{order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</p>
            </div>
          </div>

          {order.note && (
            <div className="bg-muted p-3 rounded-lg text-sm">
              <span className="font-semibold mr-2">Ghi chú đơn:</span> {order.note}
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-3 border-b pb-2">Danh sách món ({order.items.length})</h4>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {item.quantity}x {item.productName} ({item.sizeName})
                    </div>
                    {item.options && item.options.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        + {item.options.map(o => o.optionName).join(', ')}
                      </div>
                    )}
                    {item.note && (
                      <div className="text-xs text-amber-600 mt-0.5">
                        Lưu ý: {item.note}
                      </div>
                    )}
                  </div>
                  <div className="font-medium text-right shrink-0">
                    {item.totalPrice.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t pt-4 mt-auto">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Tổng cộng:</span>
            <span className="text-primary">{order.totalAmount.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function OrderHistoryPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(0)
  
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['orders', keyword, status, page],
    queryFn: () => orderApi.getAll({ keyword: keyword || undefined, status: status || undefined, page, size: 20 }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) => orderApi.updateStatus(id, 'CANCELLED'),
    onSuccess: () => {
      toast.success('Đã hủy đơn hàng')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Không thể hủy đơn hàng')
  })

  const handleCancelOrder = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
      cancelMutation.mutate(id)
    }
  }

  const orders = data?.content || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Lịch sử đơn hàng
          </h1>
          <p className="text-muted-foreground mt-1">Quản lý và tra cứu các đơn hàng đã tạo</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[250px] max-w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm mã đơn, tên, sđt khách..." 
                className="pl-9"
                value={keyword}
                onChange={e => { setKeyword(e.target.value); setPage(0) }}
              />
            </div>
            <Select value={status} onValueChange={v => { setStatus(v); setPage(0) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái đơn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="PENDING">Đang chờ</SelectItem>
                <SelectItem value="COMPLETED">Đã hoàn thành</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã ĐH</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người tạo</TableHead>
                <TableHead className="w-[100px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Không tìm thấy đơn hàng nào</TableCell></TableRow>
              ) : (
                orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium text-primary">{order.orderCode}</TableCell>
                    <TableCell>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <div>{order.customerName || 'Khách lẻ'}</div>
                      <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                    </TableCell>
                    <TableCell className="font-semibold">{order.totalAmount.toLocaleString('vi-VN')}đ</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'COMPLETED' ? 'default' : order.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
                        {order.status === 'PENDING' ? 'Chờ xử lý' : order.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.createdBy}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" title="Xem chi tiết" onClick={() => { setSelectedOrder(order); setDetailsOpen(true) }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {order.status === 'PENDING' && (
                        <Button variant="ghost" size="icon" title="Hủy đơn" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleCancelOrder(order.id)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination controls can be added here based on totalPages */}
        </CardContent>
      </Card>

      <OrderDetailsDialog order={selectedOrder} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </div>
  )
}
