import { useState, useMemo } from 'react'
import { TrendingUp, ShoppingCart, Users, DollarSign, Store, Loader2, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { shiftApi } from '@/features/shift/api/shift.api'
import type { Shift } from '@/features/shift/types/shift.types'
import { useAuthStore } from '@/stores/authStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useNavigate } from 'react-router-dom'

const statCards = [
  {
    title: 'Doanh thu hôm nay',
    value: '—',
    description: 'Sẽ hiện khi có dữ liệu',
    icon: DollarSign,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    title: 'Đơn hàng hôm nay',
    value: '—',
    description: 'Sẽ hiện khi có dữ liệu',
    icon: ShoppingCart,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: 'Nhân viên',
    value: '—',
    description: 'Sẽ hiện khi có dữ liệu',
    icon: Users,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
  },
  {
    title: 'Tăng trưởng',
    value: '—',
    description: 'Sẽ hiện khi có dữ liệu',
    icon: TrendingUp,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
]

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  // Shift Management State
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  
  const [shiftModalOpen, setShiftModalOpen] = useState(false)
  const [startCash, setStartCash] = useState<number>(0)
  const [isOpeningShift, setIsOpeningShift] = useState(false)

  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false)
  const [endCash, setEndCash] = useState<number>(0)
  const [isClosingShift, setIsClosingShift] = useState(false)

  const { data: shiftData, isError: isShiftError, refetch: refetchShift } = useQuery({
    queryKey: ['current-shift'],
    queryFn: shiftApi.getCurrentShift,
    retry: false
  })

  useMemo(() => {
    if (shiftData?.data) {
      setActiveShift(shiftData.data)
    } else if (isShiftError) {
      setActiveShift(null)
    }
  }, [shiftData, isShiftError])

  const handleOpenShift = async () => {
    setIsOpeningShift(true)
    try {
      const res = await shiftApi.openShift({ startingCash: startCash })
      setActiveShift(res.data)
      setShiftModalOpen(false)
      toast.success('Mở ca thành công!')
      refetchShift()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể mở ca')
    } finally {
      setIsOpeningShift(false)
    }
  }

  const handleCloseShift = async () => {
    setIsClosingShift(true)
    try {
      await shiftApi.closeShift({ actualCash: endCash })
      setActiveShift(null)
      setCloseShiftModalOpen(false)
      toast.success('Đóng ca thành công!')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể đóng ca')
    } finally {
      setIsClosingShift(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Xin chào, {user?.fullName} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Tổng quan hoạt động cửa hàng hôm nay
        </p>
      </div>

      {/* Shift Management Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/50 border-primary/20 shadow-sm bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Ca làm việc
            </CardTitle>
            <CardDescription>
              {activeShift ? 'Bạn đang trong ca làm việc' : 'Chưa có ca làm việc nào được mở'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeShift ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thu ngân:</span>
                  <span className="font-medium">{activeShift.openedByName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giờ mở ca:</span>
                  <span className="font-medium">{new Date(activeShift.openedAt).toLocaleTimeString('vi-VN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tiền mặt đầu ca:</span>
                  <span className="font-medium">{activeShift.startingCash.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-sm text-muted-foreground">Vui lòng mở ca để có thể sử dụng máy POS và tạo đơn hàng.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-2">
            {activeShift ? (
              <div className="flex gap-2 w-full">
                <Button 
                  className="flex-1" 
                  onClick={() => navigate('/pos')}
                >
                  Vào máy POS <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setEndCash(0)
                    setCloseShiftModalOpen(true)
                  }}
                >
                  Đóng ca
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full" 
                onClick={() => {
                  setStartCash(0)
                  setShiftModalOpen(true)
                }}
              >
                Mở ca bán hàng
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="border-border/50 transition-shadow hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Placeholder content */}
      <Card className="border-border/50 border-dashed">
        <CardContent className="flex min-h-[200px] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">
              📊 Biểu đồ doanh thu sẽ hiện ở Phase 6
            </p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              Hoàn thành các phase trước để có dữ liệu dashboard
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Modals for Shift Management */}
      <Dialog open={shiftModalOpen} onOpenChange={setShiftModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-center">Mở Ca Làm Việc</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="text-center text-muted-foreground">
              Nhập số tiền mặt hiện có trong két để bắt đầu ca bán hàng mới.
            </div>
            <div className="space-y-2">
              <Label htmlFor="startCash">Tiền mặt đầu ca (VNĐ)</Label>
              <Input
                id="startCash"
                type="number"
                value={startCash}
                onChange={(e) => setStartCash(Number(e.target.value))}
                placeholder="VD: 1000000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShiftModalOpen(false)}>Hủy</Button>
            <Button 
              className="w-full" 
              onClick={handleOpenShift}
              disabled={isOpeningShift || startCash < 0}
            >
              {isOpeningShift ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Xác Nhận Mở Ca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeShiftModalOpen} onOpenChange={setCloseShiftModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-center">Đóng Ca Bàn Giao</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thu ngân:</span>
                <span className="font-semibold">{activeShift?.openedByName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tiền mặt đầu ca:</span>
                <span className="font-semibold">{activeShift?.startingCash?.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Label htmlFor="endCash">Tiền mặt thực tế trong két (VNĐ)</Label>
              <Input
                id="endCash"
                type="number"
                value={endCash}
                onChange={(e) => setEndCash(Number(e.target.value))}
                placeholder="VD: 5000000"
              />
              <p className="text-xs text-muted-foreground">
                Vui lòng đếm lại tiền mặt trong két và nhập chính xác số tiền hiện có.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseShiftModalOpen(false)}>Hủy</Button>
            <Button 
              variant="destructive"
              onClick={handleCloseShift}
              disabled={isClosingShift || endCash < 0}
            >
              {isClosingShift ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Xác Nhận Đóng Ca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
