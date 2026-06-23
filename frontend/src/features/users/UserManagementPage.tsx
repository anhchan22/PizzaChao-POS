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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UsersIcon className="h-6 w-6 text-primary" />
            Quản lý nhân viên
          </h1>
          <p className="mt-1 text-muted-foreground">
            Quản lý tài khoản nhân viên của cửa hàng
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, username..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Role filter */}
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tất cả vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả vai trò</SelectItem>
                <SelectItem value="OWNER">Chủ cửa hàng</SelectItem>
                <SelectItem value="STAFF">Nhân viên</SelectItem>
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Đã khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Tên đăng nhập</TableHead>
                <TableHead>Điện thoại</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground">Đang tải...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !users?.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    Không có nhân viên nào
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u, i) => (
                  <TableRow key={u.id} className="group">
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{u.fullName}</div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {u.username}
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.phone || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'OWNER' ? 'default' : 'secondary'}>
                        {u.role === 'OWNER' ? 'Chủ cửa hàng' : 'Nhân viên'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.status === 'ACTIVE' ? 'default' : 'destructive'}
                        className={
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20'
                            : ''
                        }
                      >
                        <span
                          className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                            u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-destructive'
                          }`}
                        />
                        {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => handleOpenEdit(u)}
                          >
                            <Pencil className="h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => handleResetPassword(u)}
                          >
                            <KeyRound className="h-4 w-4" />
                            Reset mật khẩu
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.status === 'ACTIVE' ? (
                              <>
                                <ShieldOff className="h-4 w-4 text-destructive" />
                                <span className="text-destructive">Khóa tài khoản</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
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
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editingUser} />
      <ResetPasswordDialog
        open={resetPwOpen}
        onOpenChange={setResetPwOpen}
        user={resetPwUser}
      />
    </div>
  )
}
