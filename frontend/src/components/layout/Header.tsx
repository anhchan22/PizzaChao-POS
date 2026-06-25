import { KeyRound, Loader2, LogOut, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { shiftApi } from '@/features/shift/api/shift.api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const currentShift = await shiftApi.getCurrentShift()
      if (currentShift.data) {
        toast.warning('Bạn đang có ca làm việc chưa đóng. Vui lòng đóng ca trước khi đăng xuất.')
        navigate('/dashboard')
        return
      }

      await logout()
      navigate('/login', { replace: true })
    } catch (error: unknown) {
      const serverMessage = typeof error === 'object'
        && error !== null
        && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : null

      const safeMessage = serverMessage
        && !serverMessage.includes('No static resource')
        && !serverMessage.startsWith('Lỗi hệ thống:')
        ? serverMessage
        : 'Không thể đăng xuất lúc này. Vui lòng thử lại.'

      toast.error(safeMessage)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl">
      {/* Left: Page breadcrumb area */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          {/* Dynamic page title can be added via context */}
        </h2>
      </div>

      {/* Right: User menu */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 px-2 py-1.5 h-auto">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{user?.username}</p>
              </div>
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Badge
                variant={user?.role === 'OWNER' ? 'default' : 'secondary'}
                className="text-[10px] h-5 hidden sm:flex"
              >
                {user?.role === 'OWNER' ? 'Chủ cửa hàng' : 'Nhân viên'}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <p className="font-medium">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground">{user?.role === 'OWNER' ? 'Chủ cửa hàng' : 'Nhân viên'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <UserIcon className="h-4 w-4" />
              Thông tin cá nhân
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <KeyRound className="h-4 w-4" />
              Đổi mật khẩu
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <LogOut className="h-4 w-4" />}
              {isLoggingOut ? 'Đang kiểm tra ca...' : 'Đăng xuất'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
