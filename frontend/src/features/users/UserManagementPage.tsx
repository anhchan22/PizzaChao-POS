import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  MoreHorizontal,
  UserPlus,
  Pencil,
  KeyRound,
  ShieldCheck,
  ShieldOff,
  Loader2,
  Users as UsersIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { userApi } from '@/apis/user.api'
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
  UserStatus,
} from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ─── User Form Dialog ───────────────────────────────────────────────
interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
}

function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!user

  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'STAFF' as UserRole,
  })

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      if (user) {
        setForm({
          username: user.username,
          password: '',
          fullName: user.fullName,
          phone: user.phone || '',
          role: user.role,
        })
      } else {
        setForm({ username: '', password: '', fullName: '', phone: '', role: 'STAFF' })
      }
    }
    onOpenChange(isOpen)
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Tạo nhân viên thành công')
      onOpenChange(false)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Tạo nhân viên thất bại')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
      userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Cập nhật thành công')
      onOpenChange(false)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Cập nhật thất bại')
    },
  })

  const isLoading = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing && user) {
      updateMutation.mutate({
        id: user.id,
        data: { fullName: form.fullName, phone: form.phone || undefined },
      })
    } else {
      createMutation.mutate({
        username: form.username,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone || undefined,
        role: form.role,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {isEditing ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Cập nhật thông tin nhân viên'
              : 'Điền thông tin để tạo tài khoản nhân viên mới'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Username (disabled when editing) */}
          <div className="space-y-2">
            <Label htmlFor="form-username">Tên đăng nhập</Label>
            <Input
              id="form-username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Nhập tên đăng nhập"
              disabled={isEditing}
              required={!isEditing}
            />
          </div>

          {/* Password (only for create) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="form-password">Mật khẩu</Label>
              <Input
                id="form-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Tối thiểu 6 ký tự"
                required
                minLength={6}
              />
            </div>
          )}

          {/* Full name */}
          <div className="space-y-2">
            <Label htmlFor="form-fullname">Họ và tên</Label>
            <Input
              id="form-fullname"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Nhập họ và tên"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="form-phone">Số điện thoại</Label>
            <Input
              id="form-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Nhập số điện thoại (tuỳ chọn)"
            />
          </div>

          {/* Role (only for create) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <Select
                value={form.role}
                onValueChange={(value) => setForm({ ...form, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Nhân viên</SelectItem>
                  <SelectItem value="OWNER">Chủ cửa hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Lưu thay đổi' : 'Tạo nhân viên'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Reset Password Dialog ──────────────────────────────────────────
interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

function ResetPasswordDialog({ open, onOpenChange, user }: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('')

  const mutation = useMutation({
    mutationFn: () => userApi.resetPassword(user!.id, { newPassword }),
    onSuccess: () => {
      toast.success(`Đã reset mật khẩu cho ${user?.fullName}`)
      setNewPassword('')
      onOpenChange(false)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Reset mật khẩu thất bại')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-500" />
            Reset mật khẩu
          </DialogTitle>
          <DialogDescription>
            Đặt mật khẩu mới cho <strong>{user?.fullName}</strong> ({user?.username})
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
          className="space-y-4 pt-2"
        >
          <div className="space-y-2">
            <Label htmlFor="reset-password">Mật khẩu mới</Label>
            <Input
              id="reset-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              required
              minLength={6}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đặt mật khẩu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────
export function UserManagementPage() {
  const queryClient = useQueryClient()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterRole, setFilterRole] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  // Dialogs state
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resetPwOpen, setResetPwOpen] = useState(false)
  const [resetPwUser, setResetPwUser] = useState<User | null>(null)

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['users', filterRole, filterStatus, searchKeyword],
    queryFn: () =>
      userApi.getAll({
        role: filterRole || undefined,
        status: filterStatus || undefined,
        keyword: searchKeyword || undefined,
      }),
    select: (res) => res.data.data,
  })

  // Toggle status
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: UserStatus }) =>
      userApi.updateStatus(id, { status }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(
        vars.status === 'ACTIVE' ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản'
      )
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Cập nhật trạng thái thất bại')
    },
  })

  const handleOpenCreate = () => {
    setEditingUser(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setEditingUser(user)
    setFormOpen(true)
  }

  const handleResetPassword = (user: User) => {
    setResetPwUser(user)
    setResetPwOpen(true)
  }

  const handleToggleStatus = (user: User) => {
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    statusMutation.mutate({ id: user.id, status: newStatus })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-[calc(100vh-1.5rem)] rounded-2xl bg-[#d2f2e7] p-1 text-[#022c22] sm:p-4">
      <div className="space-y-1 sm:space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-1 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        {/* Page header */}
        <div className="flex items-center justify-between gap-1 sm:gap-3">
          <h1 className="flex items-center gap-0.5 sm:gap-2 text-[10px] sm:text-3xl font-black leading-none tracking-[-0.04em] text-[#022c22]">
            <UsersIcon className="h-3.5 w-3.5 sm:h-7 sm:w-7 text-[#007a55]" />
            <span className="sm:hidden">Nhân viên</span>
            <span className="hidden sm:inline">Quản lý nhân viên</span>
          </h1>
          <Button
            size="sm"
            className="h-5 px-1.5 rounded text-[8px] sm:h-9 sm:px-4 sm:rounded-full sm:text-sm bg-[#00bc7d] text-white hover:bg-[#007a55]"
            onClick={handleOpenCreate}
          >
            <Plus className="mr-0.5 h-2 w-2 sm:mr-1 sm:h-4 sm:w-4" />
            Thêm nhân viên
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 sm:gap-3 w-full">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-1.5 sm:left-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, username..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-5 sm:pl-9 h-6 sm:h-9 text-[8px] sm:text-sm rounded border-[#e5e7eb] placeholder:text-[8px] sm:placeholder:text-sm"
            />
          </div>

          {/* Role filter */}
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[72px] sm:w-[160px] h-6 sm:h-9 text-[8px] sm:text-sm px-1 sm:px-3 rounded border-[#e5e7eb] shrink-0">
              <SelectValue placeholder="Vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-[10px] sm:text-sm">Tất cả vai trò</SelectItem>
              <SelectItem value="OWNER" className="text-[10px] sm:text-sm">Chủ cửa hàng</SelectItem>
              <SelectItem value="STAFF" className="text-[10px] sm:text-sm">Nhân viên</SelectItem>
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[72px] sm:w-[160px] h-6 sm:h-9 text-[8px] sm:text-sm px-1 sm:px-3 rounded border-[#e5e7eb] shrink-0">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-[10px] sm:text-sm">Tất cả trạng thái</SelectItem>
              <SelectItem value="ACTIVE" className="text-[10px] sm:text-sm">Đang hoạt động</SelectItem>
              <SelectItem value="INACTIVE" className="text-[10px] sm:text-sm">Đã khóa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-[#e5e7eb]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-[#022c22] border-b border-[#022c22]">
                <TableHead className="w-6 sm:w-10 px-1 sm:px-3 py-0.5 sm:py-2 font-bold text-white text-[8px] sm:text-xs">#</TableHead>
                <TableHead className="px-1 sm:px-3 py-0.5 sm:py-2 font-bold text-white text-[8px] sm:text-xs">Họ tên</TableHead>
                <TableHead className="px-1 sm:px-3 py-0.5 sm:py-2 font-bold text-white text-[8px] sm:text-xs">Tên đăng nhập</TableHead>
                <TableHead className="px-1 sm:px-3 py-0.5 sm:py-2 font-bold text-white text-[8px] sm:text-xs">Điện thoại</TableHead>
                <TableHead className="px-1 sm:px-3 py-0.5 sm:py-2 font-bold text-white text-[8px] sm:text-xs">Vai trò</TableHead>
                <TableHead className="px-1 sm:px-3 py-0.5 sm:py-2 font-bold text-white text-[8px] sm:text-xs">Trạng thái</TableHead>
                <TableHead className="px-1 sm:px-3 py-0.5 sm:py-2 font-bold text-white text-[8px] sm:text-xs">Ngày tạo</TableHead>
                <TableHead className="w-8 sm:w-12 px-1 sm:px-3 py-0.5 sm:py-2 text-right font-bold text-white text-[8px] sm:text-xs"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-20 text-center py-2">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Loader2 className="h-3.5 w-3.5 sm:h-5 sm:w-5 animate-spin text-muted-foreground" />
                      <span className="text-[9px] sm:text-sm text-[#71717a]">Đang tải...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !users?.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-20 text-center py-2 text-[9px] sm:text-sm text-[#71717a]">
                    Không có nhân viên nào
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u, i) => (
                  <TableRow key={u.id} className="group">
                    <TableCell className="px-1 sm:px-3 py-0.5 sm:py-2 text-muted-foreground font-mono text-[8px] sm:text-sm">
                      {i + 1}
                    </TableCell>
                    <TableCell className="px-1 sm:px-3 py-0.5 sm:py-2">
                      <div className="font-bold text-[#022c22] text-[8px] sm:text-sm">{u.fullName}</div>
                    </TableCell>
                    <TableCell className="px-1 sm:px-3 py-0.5 sm:py-2">
                      <code className="text-[7px] sm:text-xs bg-muted px-1 sm:px-1.5 py-0.5 rounded">
                        {u.username}
                      </code>
                    </TableCell>
                    <TableCell className="px-1 sm:px-3 py-0.5 sm:py-2 text-[8px] sm:text-sm text-[#71717a]">
                      {u.phone || '—'}
                    </TableCell>
                    <TableCell className="px-1 sm:px-3 py-0.5 sm:py-2">
                      <Badge variant={u.role === 'OWNER' ? 'default' : 'secondary'} className="px-1 sm:px-2 py-0 sm:py-0.5 text-[7px] sm:text-xs scale-[0.85] sm:scale-100 origin-left whitespace-nowrap">
                        {u.role === 'OWNER' ? 'Chủ cửa hàng' : 'Nhân viên'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-1 sm:px-3 py-0.5 sm:py-2">
                      <Badge
                        variant={u.status === 'ACTIVE' ? 'default' : 'destructive'}
                        className={cn(
                          'px-1 sm:px-2 py-0 sm:py-0.5 text-[7px] sm:text-xs scale-[0.85] sm:scale-100 origin-left whitespace-nowrap',
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10'
                            : ''
                        )}
                      >
                        <span
                          className={`mr-0.5 sm:mr-1 inline-block h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full ${
                            u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-destructive'
                          }`}
                        />
                        {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-1 sm:px-3 py-0.5 sm:py-2 text-[8px] sm:text-sm text-[#71717a] whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="px-1 sm:px-3 py-0.5 sm:py-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 sm:h-8 sm:w-8 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#022c22]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 sm:w-48 text-xs sm:text-sm">
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-xs"
                            onClick={() => handleOpenEdit(u)}
                          >
                            <Pencil className="h-3 w-3" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-xs"
                            onClick={() => handleResetPassword(u)}
                          >
                            <KeyRound className="h-3 w-3" />
                            Reset mật khẩu
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-xs"
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.status === 'ACTIVE' ? (
                              <>
                                <ShieldOff className="h-3 w-3 text-destructive" />
                                <span className="text-destructive">Khóa tài khoản</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                <span className="text-emerald-500">Kích hoạt</span>
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

      {/* Dialogs */}
      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editingUser} />
      <ResetPasswordDialog
        open={resetPwOpen}
        onOpenChange={setResetPwOpen}
        user={resetPwUser}
      />
      </div>
    </div>
  )
}
