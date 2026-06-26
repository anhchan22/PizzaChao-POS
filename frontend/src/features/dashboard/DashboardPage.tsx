import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, DollarSign, Loader2, ShoppingCart, Store, TrendingUp, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { shiftApi } from '@/features/shift/api/shift.api'
import { useAuthStore } from '@/stores/authStore'

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const statCards = [
  { title: 'Doanh thu hôm nay', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { title: 'Đơn hàng hôm nay', icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { title: 'Nhân viên', icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { title: 'Tăng trưởng', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
]

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    return response?.data?.message ?? fallback
  }
  return fallback
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [openDialog, setOpenDialog] = useState(false)
  const [closeDialog, setCloseDialog] = useState(false)
  const [startingCash, setStartingCash] = useState('')
  const [actualCash, setActualCash] = useState('')
  const [openingNote, setOpeningNote] = useState('')
  const [closingNote, setClosingNote] = useState('')

  const currentShiftQuery = useQuery({
    queryKey: ['current-shift'],
    queryFn: shiftApi.getCurrentShift,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  const activeShift = currentShiftQuery.data?.data ?? null
  const parsedStartingCash = Number(startingCash)
  const parsedActualCash = Number(actualCash)
  const cashDifference = activeShift && Number.isFinite(parsedActualCash)
    ? parsedActualCash - activeShift.expectedCash
    : 0

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
      setCloseDialog(false)
      setActualCash('')
      setClosingNote('')
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
    closeShiftMutation.mutate({
      actualCash: parsedActualCash,
      closingNote: closingNote.trim() || undefined,
    })
  }

  return (
    <div className="space-y-6">

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
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ title, icon: Icon, color, bg }) => (
          <Card key={title} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="mt-1 text-xs text-muted-foreground">Sẽ cập nhật ở module báo cáo</p>
            </CardContent>
          </Card>
        ))}
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
        <DialogContent className="sm:max-w-[480px]">
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
                placeholder="Nhập số tiền đã đếm trong két"
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
                placeholder="Nêu lý do thừa/thiếu tiền nếu có"
              />
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
