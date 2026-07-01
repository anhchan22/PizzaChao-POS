import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Boxes, EditIcon, History, Loader2, PackagePlus, PlusIcon, Search, TrashIcon } from 'lucide-react'
import { toast } from 'sonner'
import { sizeApi } from '@/apis/product.api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/stores/authStore'
import { inventoryApi } from './api/inventory.api'
import type { InventoryItem, InventoryItemRequest, InventoryUsageRuleRequest, StockMovementType } from './types/inventory.types'

const defaultForm: InventoryItemRequest = {
  name: '',
  unit: 'cái',
  currentQuantity: 0,
  warningQuantity: 20,
  active: true,
  note: '',
  usageRules: [],
}

const movementLabels: Record<StockMovementType, string> = {
  IN: 'Nhập hàng',
  OUT: 'Xuất kho',
  AUTO_DEDUCT: 'Tự trừ khi bán',
  SHIFT_CLOSE_ADJUST: 'Điều chỉnh khi đóng ca',
}

function numberText(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
}

function dateTimeText(value?: string | null) {
  return value ? new Date(value).toLocaleString('vi-VN') : '—'
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback
  }
  return fallback
}

export default function InventoryManagementPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const isOwner = user?.role === 'OWNER'
  const [keyword, setKeyword] = useState('')
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [stockInDialogOpen, setStockInDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [stockInQuantity, setStockInQuantity] = useState('')
  const [stockInNote, setStockInNote] = useState('')
  const [formData, setFormData] = useState<InventoryItemRequest>(defaultForm)

  const inventoryQuery = useQuery({
    queryKey: ['inventory-items', keyword, activeFilter],
    queryFn: () => inventoryApi.getAll({
      keyword: keyword.trim() || undefined,
      active: activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE',
    }),
  })

  const sizesQuery = useQuery({
    queryKey: ['sizes'],
    queryFn: sizeApi.getAll,
  })

  const movementsQuery = useQuery({
    queryKey: ['inventory-movements', selectedItem?.id],
    queryFn: () => inventoryApi.getMovements(selectedItem!.id),
    enabled: historyDialogOpen && Boolean(selectedItem),
  })

  const items = inventoryQuery.data?.data ?? []
  const sizes = sizesQuery.data ?? []
  const lowStockItems = useMemo(() => items.filter((item) => item.lowStock), [items])

  const saveMutation = useMutation({
    mutationFn: (payload: InventoryItemRequest) => editingItem
      ? inventoryApi.update(editingItem.id, payload)
      : inventoryApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      setItemDialogOpen(false)
      setEditingItem(null)
      setFormData(defaultForm)
      toast.success(editingItem ? 'Đã cập nhật vật tư' : 'Đã tạo vật tư')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Không thể lưu vật tư')),
  })

  const stockInMutation = useMutation({
    mutationFn: ({ id, quantity, note }: { id: number; quantity: number; note?: string }) =>
      inventoryApi.stockIn(id, { quantity, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      setStockInDialogOpen(false)
      setSelectedItem(null)
      setStockInQuantity('')
      setStockInNote('')
      toast.success('Đã ghi nhận nhập hàng')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Không thể nhập hàng')),
  })

  const deleteMutation = useMutation({
    mutationFn: inventoryApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      toast.success('Đã xóa vật tư')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Không thể xóa vật tư')),
  })

  const openCreate = () => {
    setEditingItem(null)
    setFormData(defaultForm)
    setItemDialogOpen(true)
  }

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      unit: item.unit,
      currentQuantity: item.currentQuantity,
      warningQuantity: item.warningQuantity,
      active: item.active,
      note: item.note ?? '',
      usageRules: item.usageRules.map((rule) => ({
        sizeId: rule.sizeId,
        quantityPerOrder: rule.quantityPerOrder,
      })),
    })
    setItemDialogOpen(true)
  }

  const openStockIn = (item: InventoryItem) => {
    setSelectedItem(item)
    setStockInQuantity('')
    setStockInNote('')
    setStockInDialogOpen(true)
  }

  const openHistory = (item: InventoryItem) => {
    setSelectedItem(item)
    setHistoryDialogOpen(true)
  }

  const updateRule = (index: number, patch: Partial<InventoryUsageRuleRequest>) => {
    setFormData((current) => ({
      ...current,
      usageRules: current.usageRules.map((rule, idx) => idx === index ? { ...rule, ...patch } : rule),
    }))
  }

  const addRule = () => {
    const unusedSize = sizes.find((size) => !formData.usageRules.some((rule) => rule.sizeId === size.id))
    if (!unusedSize) {
      toast.error('Tất cả size đã được cấu hình cho vật tư này')
      return
    }
    setFormData((current) => ({
      ...current,
      usageRules: [...current.usageRules, { sizeId: unusedSize.id, quantityPerOrder: 1 }],
    }))
  }

  const removeRule = (index: number) => {
    setFormData((current) => ({
      ...current,
      usageRules: current.usageRules.filter((_, idx) => idx !== index),
    }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên vật tư')
      return
    }
    if (formData.currentQuantity < 0 || formData.warningQuantity < 0) {
      toast.error('Số lượng không được âm')
      return
    }

    saveMutation.mutate({
      ...formData,
      name: formData.name.trim(),
      unit: formData.unit.trim() || 'cái',
      note: formData.note?.trim() || undefined,
      usageRules: formData.usageRules.filter((rule) => rule.sizeId && rule.quantityPerOrder > 0),
    })
  }

  const handleStockInSubmit = () => {
    if (!selectedItem) return
    const quantity = Number(stockInQuantity)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Số lượng nhập phải lớn hơn 0')
      return
    }
    stockInMutation.mutate({
      id: selectedItem.id,
      quantity,
      note: stockInNote.trim() || undefined,
    })
  }

  return (
    <div className="min-h-[calc(100vh-1.5rem)] rounded-2xl bg-[#d2f2e7] p-3 text-[#022c22] sm:p-4">
      <div className="space-y-6 rounded-2xl border border-[#e5e7eb] bg-white/90 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black leading-none tracking-[-0.04em] text-[#022c22] sm:text-3xl">
            <Boxes className="h-7 w-7 text-primary" />
            Kho vật tư
          </h1>
        </div>
        {isOwner && (
          <Button onClick={openCreate}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Thêm vật tư
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="pl-9"
              placeholder="Tìm vật tư..."
            />
          </div>
          <Select value={activeFilter} onValueChange={(value) => setActiveFilter(value as 'ALL' | 'ACTIVE' | 'INACTIVE')}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Đang dùng</SelectItem>
              <SelectItem value="INACTIVE">Tạm tắt</SelectItem>
              <SelectItem value="ALL">Tất cả</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vật tư</TableHead>
              <TableHead>Số lượng</TableHead>
              <TableHead>Đơn vị</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Cập nhật cuối</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryQuery.isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center">Đang tải...</TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center">Chưa có vật tư nào</TableCell></TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-semibold">{item.name}</div>
                    {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
                  </TableCell>
                  <TableCell className="font-bold text-primary">
                    {numberText(item.currentQuantity)}
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.lowStock ? (
                        <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Sắp hết</Badge>
                      ) : (
                        <Badge variant="secondary">Còn hàng</Badge>
                      )}
                      {!item.active && <Badge variant="outline">Tạm tắt</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{dateTimeText(item.updatedAt ?? item.lastStocktakeAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openStockIn(item)}>
                      <PackagePlus className="mr-2 h-4 w-4" />
                      Nhập
                    </Button>
                    {/* <Button variant="ghost" size="sm" onClick={() => openHistory(item)}>
                      <History className="mr-2 h-4 w-4" />
                      Lịch sử
                    </Button> */}
                    {isOwner && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (confirm('Bạn có chắc muốn xóa vật tư này?')) deleteMutation.mutate(item.id)
                          }}
                        >
                          <TrashIcon className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader><DialogTitle>{editingItem ? 'Sửa vật tư' : 'Thêm vật tư'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tên vật tư</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  placeholder="VD: Cốc size S"
                />
              </div>
              <div className="space-y-2">
                <Label>Đơn vị tính</Label>
                <Input
                  required
                  value={formData.unit}
                  onChange={(event) => setFormData((current) => ({ ...current, unit: event.target.value }))}
                  placeholder="cái, hộp, túi..."
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{editingItem ? 'Tồn hiện tại' : 'Tồn hiện tại ban đầu'}</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  disabled={Boolean(editingItem)}
                  value={formData.currentQuantity}
                  onChange={(event) => setFormData((current) => ({ ...current, currentQuantity: Number(event.target.value) }))}
                />
                {/* {editingItem && (
                  <p className="text-xs text-muted-foreground">Muốn tăng tồn hãy dùng nút Nhập hàng ngoài bảng.</p>
                )} */}
              </div>
              <div className="space-y-2">
                <Label>Ngưỡng cảnh báo sắp hết</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.warningQuantity}
                  onChange={(event) => setFormData((current) => ({ ...current, warningQuantity: Number(event.target.value) }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Đang theo dõi</Label>
                {/* <p className="text-xs text-muted-foreground">Tắt nếu vật tư này không còn dùng.</p> */}
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData((current) => ({ ...current, active: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={formData.note}
                onChange={(event) => setFormData((current) => ({ ...current, note: event.target.value }))}
                placeholder="VD: dùng cho cháo size S"
                maxLength={500}
              />
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Quy tắc trừ theo size</Label>
                  {/* <p className="text-xs text-muted-foreground">Chỉ dùng để hệ thống gợi ý tồn dự kiến khi đóng ca.</p> */}
                </div>
                <Button type="button" variant="outline" onClick={addRule}>Thêm rule</Button>
              </div>
              {formData.usageRules.length === 0 ? (
                <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  Chưa có rule. Vật tư vẫn quản lý được bằng nhập hàng và kiểm kê cuối ca.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.usageRules.map((rule, index) => (
                    <div key={`${rule.sizeId}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
                      <Select
                        value={String(rule.sizeId)}
                        onValueChange={(value) => updateRule(index, { sizeId: Number(value) })}
                      >
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {sizes.map((size) => (
                            <SelectItem key={size.id} value={String(size.id)}>{size.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={rule.quantityPerOrder}
                        onChange={(event) => updateRule(index, { quantityPerOrder: Number(event.target.value) })}
                      />
                      <Button type="button" variant="ghost" className="text-destructive" onClick={() => removeRule(index)}>
                        Xóa
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setItemDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu vật tư
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={stockInDialogOpen} onOpenChange={setStockInDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader><DialogTitle>Nhập hàng</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-semibold">{selectedItem?.name}</p>
              <p className="text-muted-foreground">
                Tồn hiện tại: {selectedItem ? `${numberText(selectedItem.currentQuantity)} ${selectedItem.unit}` : '—'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Số lượng nhập thêm</Label>
              <Input
                type="number"
                min="0.01"
                step="1"
                value={stockInQuantity}
                onChange={(event) => setStockInQuantity(event.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                maxLength={500}
                value={stockInNote}
                onChange={(event) => setStockInNote(event.target.value)}
                placeholder="VD: nhập 1 thùng cốc size M"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockInDialogOpen(false)}>Hủy</Button>
            <Button disabled={stockInMutation.isPending} onClick={handleStockInSubmit}>
              {stockInMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận nhập
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[720px]">
          <DialogHeader><DialogTitle>Lịch sử kho - {selectedItem?.name}</DialogTitle></DialogHeader>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Thay đổi</TableHead>
                  <TableHead>Tồn sau</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movementsQuery.isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center">Đang tải...</TableCell></TableRow>
                ) : (movementsQuery.data?.data ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center">Chưa có lịch sử thay đổi tồn</TableCell></TableRow>
                ) : (
                  (movementsQuery.data?.data ?? []).map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{dateTimeText(movement.createdAt)}</TableCell>
                      <TableCell>{movementLabels[movement.type]}</TableCell>
                      <TableCell className={movement.quantityChange < 0 ? 'text-destructive' : 'text-emerald-600'}>
                        {movement.quantityChange > 0 ? '+' : ''}{numberText(movement.quantityChange)}
                      </TableCell>
                      <TableCell>{numberText(movement.afterQuantity)}</TableCell>
                      <TableCell>
                        <div className="max-w-[260px] text-sm">
                          {movement.note || '—'}
                          {movement.createdByName && (
                            <p className="text-xs text-muted-foreground">Bởi {movement.createdByName}</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
