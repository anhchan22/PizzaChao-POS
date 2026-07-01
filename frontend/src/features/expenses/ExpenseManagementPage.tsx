import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  EditIcon,
  ImageIcon,
  Loader2,
  PlusIcon,
  ReceiptText,
  Search,
  TrashIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { uploadApi } from '@/apis/product.api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/stores/authStore'
import { expenseApi } from './api/expense.api'
import type { Expense, ExpenseRequest, ExpenseType } from './types/expense.types'

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const expenseTypes: Array<{ value: ExpenseType; label: string }> = [
  { value: 'INGREDIENT', label: 'Nguyên vật liệu' },
  { value: 'PACKAGING', label: 'Bao bì / vật tư' },
  { value: 'UTILITY', label: 'Điện nước / gas' },
  { value: 'REPAIR', label: 'Sửa chữa' },
  { value: 'OTHER', label: 'Khác' },
]

const defaultForm: ExpenseRequest = {
  type: 'INGREDIENT',
  title: '',
  amount: 0,
  incurredAt: '',
  attachToCurrentShift: true,
  note: '',
  receiptImageUrl: '',
}

function typeLabel(type: ExpenseType) {
  return expenseTypes.find((item) => item.value === type)?.label ?? type
}

function toLocalInputValue(value: string) {
  const date = new Date(value)
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback
  }
  return fallback
}

export default function ExpenseManagementPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [formData, setFormData] = useState<ExpenseRequest>(defaultForm)
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<ExpenseType | 'ALL'>('ALL')
  const [shiftFilter, setShiftFilter] = useState<'ALL' | 'SHIFT' | 'OUTSIDE'>('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(0)

  const expensesQuery = useQuery({
    queryKey: ['expenses', keyword, typeFilter, shiftFilter, fromDate, toDate, page],
    queryFn: () => expenseApi.getAll({
      keyword: keyword.trim() || undefined,
      type: typeFilter === 'ALL' ? undefined : typeFilter,
      shiftOnly: shiftFilter === 'ALL' ? undefined : shiftFilter === 'SHIFT',
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page,
      size: 20,
    }),
  })

  const expenses = expensesQuery.data?.data?.content ?? []
  const pageData = expensesQuery.data?.data
  const totalInPage = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount), 0),
    [expenses],
  )

  const saveMutation = useMutation({
    mutationFn: (payload: ExpenseRequest) => editingExpense
      ? expenseApi.update(editingExpense.id, payload)
      : expenseApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      setDialogOpen(false)
      setEditingExpense(null)
      setFormData(defaultForm)
      toast.success(editingExpense ? 'Đã cập nhật chi phí' : 'Đã ghi nhận chi phí')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Không thể lưu chi phí')),
  })

  const deleteMutation = useMutation({
    mutationFn: expenseApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Đã xóa chi phí')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Không thể xóa chi phí')),
  })

  const uploadMutation = useMutation({
    mutationFn: uploadApi.uploadImage,
    onSuccess: (url) => {
      setFormData((current) => ({ ...current, receiptImageUrl: url }))
      toast.success('Đã tải ảnh hóa đơn')
    },
    onError: () => toast.error('Không thể tải ảnh hóa đơn'),
  })

  const openCreate = () => {
    setEditingExpense(null)
    setFormData({
      ...defaultForm,
      incurredAt: toLocalInputValue(new Date().toISOString()),
    })
    setDialogOpen(true)
  }

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      type: expense.type,
      title: expense.title,
      amount: Number(expense.amount),
      incurredAt: toLocalInputValue(expense.incurredAt),
      attachToCurrentShift: expense.shiftId !== null,
      note: expense.note ?? '',
      receiptImageUrl: expense.receiptImageUrl ?? '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tên khoản chi')
      return
    }
    if (!Number.isFinite(formData.amount) || formData.amount <= 0) {
      toast.error('Số tiền phải lớn hơn 0')
      return
    }

    saveMutation.mutate({
      ...formData,
      title: formData.title.trim(),
      incurredAt: formData.incurredAt || undefined,
      note: formData.note?.trim() || undefined,
      receiptImageUrl: formData.receiptImageUrl?.trim() || undefined,
    })
  }

  return (
    <div className="min-h-[calc(100vh-1.5rem)] rounded-2xl bg-[#d2f2e7] p-3 text-[#022c22] sm:p-4">
      <div className="space-y-6 rounded-2xl border border-[#e5e7eb] bg-white/90 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black leading-none tracking-[-0.04em] text-[#022c22] sm:text-3xl">
            <ReceiptText className="h-7 w-7 text-primary" />
            Quản lý chi phí
          </h1>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Thêm chi phí
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Tổng Chi hiện tại</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-primary">{currency.format(totalInPage)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Số khoản chi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black">{pageData?.totalElements ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value)
                  setPage(0)
                }}
                className="pl-9"
                placeholder="Tìm tên khoản chi hoặc ghi chú..."
              />
            </div>
            <Select value={typeFilter} onValueChange={(value) => {
              setTypeFilter(value as ExpenseType | 'ALL')
              setPage(0)
            }}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Loại chi phí" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả loại</SelectItem>
                {expenseTypes.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={shiftFilter} onValueChange={(value) => {
              setShiftFilter(value as 'ALL' | 'SHIFT' | 'OUTSIDE')
              setPage(0)
            }}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Phạm vi ca" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="SHIFT">Trong ca</SelectItem>
                <SelectItem value="OUTSIDE">Ngoài ca</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(0) }} />
            <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(0) }} />
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khoản chi</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Người ghi</TableHead>
              <TableHead>Ca</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expensesQuery.isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center">Đang tải...</TableCell></TableRow>
            ) : expenses.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center">Chưa có khoản chi nào</TableCell></TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <div className="font-semibold">{expense.title}</div>
                    {expense.note && <div className="text-xs text-muted-foreground">{expense.note}</div>}
                    {expense.receiptImageUrl && (
                      <a
                        href={expense.receiptImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ImageIcon className="h-3 w-3" />
                        Xem hóa đơn
                      </a>
                    )}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{typeLabel(expense.type)}</Badge></TableCell>
                  <TableCell>{new Date(expense.incurredAt).toLocaleString('vi-VN')}</TableCell>
                  <TableCell>{expense.createdByName}</TableCell>
                  <TableCell>
                    {expense.shiftId ? <Badge>Trong ca #{expense.shiftId}</Badge> : <Badge variant="outline">Ngoài ca</Badge>}
                  </TableCell>
                  <TableCell className="text-right font-bold">{currency.format(expense.amount)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(expense)}>
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (confirm('Bạn có chắc muốn xóa khoản chi này?')) {
                          deleteMutation.mutate(expense.id)
                        }
                      }}
                    >
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {(pageData?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>
            Trang trước
          </Button>
          <span className="text-sm">Trang {page + 1}/{pageData?.totalPages}</span>
          <Button variant="outline" disabled={page + 1 >= (pageData?.totalPages ?? 1)} onClick={() => setPage((current) => current + 1)}>
            Trang sau
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Sửa chi phí' : 'Thêm chi phí'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Loại chi phí</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((current) => ({ ...current, type: value as ExpenseType }))}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {expenseTypes.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Số tiền</Label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={formData.amount || ''}
                  onChange={(event) => setFormData((current) => ({ ...current, amount: Number(event.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tên khoản chi</Label>
              <Input
                required
                value={formData.title}
                onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                placeholder="VD: Mua gạo, tiền gas, sửa bếp..."
              />
            </div>

            <div className="space-y-2">
              <Label>Ngày phát sinh</Label>
              <Input
                type="datetime-local"
                value={formData.incurredAt}
                onChange={(event) => setFormData((current) => ({ ...current, incurredAt: event.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Gắn vào ca hiện tại</Label>
                <p className="text-xs text-muted-foreground">Tắt nếu đây là chi phí ngoài ca bán hàng.</p>
              </div>
              <Switch
                checked={formData.attachToCurrentShift}
                onCheckedChange={(checked) => setFormData((current) => ({ ...current, attachToCurrentShift: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={formData.note}
                onChange={(event) => setFormData((current) => ({ ...current, note: event.target.value }))}
                placeholder="Thông tin thêm nếu có"
                maxLength={500}
              />
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>Ảnh hóa đơn</Label>
                  <p className="text-xs text-muted-foreground">Tùy chọn, dùng để đối soát sau này.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadMutation.isPending}
                  onClick={() => document.getElementById('expenseReceipt')?.click()}
                >
                  {uploadMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                  Tải ảnh
                </Button>
              </div>
              <input
                id="expenseReceipt"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) uploadMutation.mutate(file)
                  event.target.value = ''
                }}
              />
              {formData.receiptImageUrl && (
                <div className="flex items-center gap-3">
                  <img src={formData.receiptImageUrl} alt="Hóa đơn" className="h-20 w-20 rounded-md border object-cover" />
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setFormData((current) => ({ ...current, receiptImageUrl: '' }))}
                  >
                    Xóa ảnh
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu chi phí
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
