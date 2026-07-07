import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, KeyRound, Loader2, LogOut, Soup, User as UserIcon, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { navigation } from '@/config/navigation'
import { useAuthStore } from '@/stores/authStore'
import { shiftApi } from '@/features/shift/api/shift.api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  isMobile?: boolean
  onNavigate?: () => void
  className?: string
}

export function Sidebar({ collapsed, onToggle, isMobile, onNavigate, className }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
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
    <aside
      className={cn(
        'z-40 flex flex-col border-r border-border/50 bg-sidebar transition-all duration-300',
        isMobile ? 'h-full w-full' : 'fixed left-0 top-0 h-screen',
        !isMobile && (collapsed ? 'w-[68px]' : 'w-[240px]'),
        className
      )}
    >
      {/* Logo + Toggle button */}
      <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Soup className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-bold text-foreground">
                PizzaCháoNgon
              </span>
              <span className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                POS System
              </span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-7 w-7 shrink-0"
        >
          {isMobile ? (
            <X className="h-4 w-4" />
          ) : collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navigation.map((group) => {
          const filteredItems = group.items.filter(
            (item) => user && item.roles.includes(user.role)
          )
          if (filteredItems.length === 0) return null

          return (
            <div key={group.label} className="mb-6">
              {!collapsed && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {filteredItems.map((item) => {
                  const isActive = location.pathname === item.href
                  const Icon = item.icon

                  const linkContent = (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                      onClick={() => isMobile && onNavigate?.()}
                    >
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0',
                          isActive ? 'text-primary' : ''
                        )}
                      />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  )

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href} delayDuration={0}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={10}>
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return linkContent
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User account - bottom left */}
      <div className="border-t border-border/50 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {collapsed ? (
              <Button
                variant="ghost"
                className="w-full justify-center p-2 h-auto"
                aria-label="Mở thông tin tài khoản"
                title={user?.fullName}
              >
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            ) : (
              <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-2.5 h-auto">
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="truncate text-sm font-medium leading-none">{user?.fullName}</span>
                  <span className="truncate text-[11px] text-muted-foreground mt-0.5">
                    {user?.role === 'OWNER' ? 'Chủ cửa hàng' : 'Nhân viên'}
                  </span>
                </div>
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
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
    </aside>
  )
}
