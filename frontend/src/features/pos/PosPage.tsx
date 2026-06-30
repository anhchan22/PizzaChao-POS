import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Banknote,
  Check,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  QrCode,
  Search,
  ShoppingCart,
  Trash2,
  Utensils,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { orderApi, type OrderRequest } from '@/apis/order.api'
import { optionApi, productApi } from '@/apis/product.api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useCartStore } from '@/stores/cartStore'
import type { PosProduct, ProductOption } from '@/types'
import { settingApi } from '../settings/api/setting.api'
import type { Setting } from '../settings/types/setting.types'
import { shiftApi } from '../shift/api/shift.api'

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

function createTransferReference(prefix: string) {
  const safePrefix = (prefix || 'PCN').replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'PCN'
  const randomPart = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()
    : Math.random().toString(36).slice(2, 12).toUpperCase()

  return `${safePrefix}${randomPart}`
}

function ProductCustomizationDialog({
  product,
  options,
  open,
  onOpenChange,
}: {
  product: PosProduct | null
  options: ProductOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const addItem = useCartStore((state) => state.addItem)
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null)
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([])
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open || !product) return
    setSelectedSizeId(product.variants[0]?.size.id ?? null)
    setSelectedOptionIds([])
    setQuantity(1)
    setNote('')
  }, [open, product])

  if (!product) return null

  const selectedVariant = product.variants.find((variant) => variant.size.id === selectedSizeId)
  const selectedOptions = options.filter((option) => selectedOptionIds.includes(option.id))
  const optionPrice = selectedOptions.reduce((sum, option) => sum + option.price, 0)
  const total = ((selectedVariant?.price ?? 0) + optionPrice) * quantity

  const toggleOption = (optionId: number) => {
    setSelectedOptionIds((current) =>
      current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId],
    )
  }

  const handleAdd = () => {
    if (!selectedVariant) {
      toast.error('Vui lòng chọn kích cỡ')
      return
    }

    addItem({
      productId: product.id,
      productName: product.name,
      sizeId: selectedVariant.size.id,
      sizeName: selectedVariant.size.name,
      unitPrice: selectedVariant.price,
      quantity,
      note: note.trim() || undefined,
      options: selectedOptions.map((option) => ({
        optionId: option.id,
        optionName: option.name,
        price: option.price,
      })),
    })
    toast.success(`Đã thêm ${product.name}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-7 py-2">
          <section className="space-y-3">
            <div>
              <Label className="text-base font-bold">Chọn kích cỡ</Label>
              <p className="text-sm text-muted-foreground">Chạm vào toàn bộ ô để chọn size.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {product.variants.map((variant) => {
                const selected = variant.size.id === selectedSizeId
                return (
                  <button
                    type="button"
                    key={variant.id}
                    onClick={() => setSelectedSizeId(variant.size.id)}
                    className={cn(
                      'relative min-h-24 cursor-pointer rounded-xl border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground shadow-lg'
                        : 'border-border bg-card hover:border-primary/60 hover:bg-primary/5',
                    )}
                  >
                    {selected && (
                      <span className="absolute right-3 top-3 rounded-full bg-primary-foreground/20 p-1">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                    <p className="text-lg font-bold">{variant.size.name}</p>
                    <p className={cn('mt-2 font-semibold', !selected && 'text-primary')}>
                      {currency.format(variant.price)}
                    </p>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <Label className="text-base font-bold">Topping và tùy chọn</Label>
              <p className="text-sm text-muted-foreground">Có thể chọn nhiều mục.</p>
            </div>
            {options.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Chưa có topping đang hoạt động.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {options.map((option) => {
                  const selected = selectedOptionIds.includes(option.id)
                  return (
                    <div
                      role="button"
                      tabIndex={0}
                      key={option.id}
                      onClick={() => toggleOption(option.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleOption(option.id) }}
                      className={cn(
                        'flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors',
                        selected
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-border hover:border-amber-500/60',
                      )}
                    >
                      <Checkbox checked={selected} tabIndex={-1} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{option.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {option.price > 0 ? `+ ${currency.format(option.price)}` : 'Miễn phí'}
                        </span>
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <div className="space-y-2">
            <Label htmlFor="item-note">Ghi chú món</Label>
            <Textarea
              id="item-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ví dụ: không hành, ít muối..."
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted p-3">
            <span className="font-semibold">Số lượng</span>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <span className="w-8 text-center text-xl font-bold">{quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11"
                onClick={() => setQuantity((value) => value + 1)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button className="min-w-48 text-base font-bold" onClick={handleAdd}>
            Thêm vào giỏ · {currency.format(total)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// PaymentDialog
function PaymentDialog({
  open,
  onOpenChange,
  totalAmount,
  paymentMethod,
  transferConfig,
  onConfirm,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalAmount: number
  paymentMethod: 'CASH' | 'TRANSFER'
  transferConfig: {
    bankId: string
    accountNo: string
    accountName: string
    transferPrefix: string
    storeName: string
    qrImageUrl: string
  }
  onConfirm: (receivedAmount?: number, paymentReference?: string) => void
  isPending: boolean
}) {
  const [receivedInput, setReceivedInput] = useState('')
  const [transferReference, setTransferReference] = useState('')
  const received = Number(receivedInput.replace(/,/g, '')) || 0
  const change = paymentMethod === 'CASH' ? received - totalAmount : 0

  useEffect(() => {
    if (open) setReceivedInput('')
  }, [open])

  useEffect(() => {
    if (open && paymentMethod === 'TRANSFER') {
      setTransferReference(createTransferReference(transferConfig.transferPrefix))
    }
  }, [open, paymentMethod, transferConfig.transferPrefix])

  const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000]

  const canConfirm =
    paymentMethod === 'TRANSFER' || (received >= totalAmount)
  const qrUrl = transferConfig.qrImageUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {paymentMethod === 'CASH' ? (
              <><Banknote className="h-5 w-5 text-green-500" /> Thanh toán tiền mặt</>
            ) : (
              <><QrCode className="h-5 w-5 text-blue-500" /> Thanh toán chuyển khoản</>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Tổng tiền */}
          <div className="rounded-xl bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">Tổng cần thanh toán</p>
            <p className="mt-1 text-3xl font-black text-primary">{currency.format(totalAmount)}</p>
          </div>

          {paymentMethod === 'CASH' ? (
            <>
              {/* Các mệnh giá nhanh */}
              <div>
                <p className="mb-2 text-sm font-semibold">Chọn nhanh mệnh giá</p>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setReceivedInput(String(amount))}
                      className={cn(
                        'rounded-lg border-2 px-2 py-2 text-sm font-semibold transition-colors',
                        received === amount
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/60',
                      )}
                    >
                      {currency.format(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nhập tay */}
              <div className="space-y-1">
                <Label htmlFor="received-amount">Khách đưa (VNĐ)</Label>
                <Input
                  id="received-amount"
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="Nhập số tiền khách đưa..."
                  value={receivedInput}
                  onChange={(e) => setReceivedInput(e.target.value)}
                  className="h-12 text-lg font-semibold"
                  autoFocus
                />
              </div>

              {/* Tiền thừa */}
              {received > 0 && (
                <div className={cn(
                  'flex items-center justify-between rounded-xl border-2 p-3',
                  change >= 0 ? 'border-green-400 bg-green-50 dark:bg-green-950/30' : 'border-red-400 bg-red-50 dark:bg-red-950/30',
                )}>
                  <span className="font-semibold">Tiền thừa</span>
                  <span className={cn('text-xl font-black', change >= 0 ? 'text-green-600' : 'text-red-500')}>
                    {change >= 0 ? currency.format(change) : `Thiếu ${currency.format(-change)}`}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {qrUrl ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border bg-white p-4 text-center text-slate-900">
                  <img
                    src={qrUrl}
                    alt="Mã QR chuyển khoản"
                    className="h-64 w-64 rounded-lg object-contain"
                  />
                  <div>
                    <p className="font-black">{transferConfig.storeName || transferConfig.accountName || 'CHAO NGON'}</p>
                    {transferConfig.accountNo && (
                      <p className="text-sm">STK: <strong>{transferConfig.accountNo}</strong></p>
                    )}
                    {transferConfig.accountName && (
                      <p className="text-sm">Chủ TK: <strong>{transferConfig.accountName}</strong></p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
                  Chưa có QR chuyển khoản. Vào <strong>Cài đặt</strong> để tải ảnh QR.
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Hủy
          </Button>
          <Button
            className="flex-1 h-12 text-base font-bold"
            disabled={!canConfirm || isPending}
            onClick={() => onConfirm(
              paymentMethod === 'CASH' ? received : undefined,
              paymentMethod === 'TRANSFER' ? transferReference : undefined,
            )}
          >
            {isPending
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : 'Xác Nhận'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function PosPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    items,
    customerName,
    customerPhone,
    note,
    removeItem,
    updateQuantity,
    setCustomerInfo,
    setNote,
    clearCart,
    getTotalPrice,
  } = useCartStore()

  const [categoryId, setCategoryId] = useState<number | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<PosProduct | null>(null)
  const [customizationOpen, setCustomizationOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  const currentShiftQuery = useQuery({
    queryKey: ['current-shift'],
    queryFn: shiftApi.getCurrentShift,
    retry: false,
  })
  const productsQuery = useQuery({
    queryKey: ['pos-products'],
    queryFn: productApi.getPosData,
    staleTime: 5 * 60 * 1000,
  })
  const optionsQuery = useQuery({
    queryKey: ['pos-options'],
    queryFn: optionApi.getPosOptions,
    staleTime: 5 * 60 * 1000,
  })
  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: settingApi.getAllSettings,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (currentShiftQuery.isLoading) return
    if (currentShiftQuery.isError || !currentShiftQuery.data?.data) {
      toast.error('Vui lòng mở ca trước khi sử dụng POS')
      navigate('/dashboard', { replace: true })
    }
  }, [currentShiftQuery.data, currentShiftQuery.isError, currentShiftQuery.isLoading, navigate])

  const categories = productsQuery.data ?? []
  const options = optionsQuery.data ?? []
  const settings = settingsQuery.data?.data ?? []
  const getSetting = (key: string, fallback = '') =>
    settings.find((setting: Setting) => setting.key === key)?.value || fallback
  const transferConfig = {
    bankId: getSetting('bankId'),
    accountNo: getSetting('accountNo'),
    accountName: getSetting('accountName'),
    transferPrefix: getSetting('transferPrefix', 'PCN'),
    storeName: getSetting('storeName', 'CHAO NGON'),
    qrImageUrl: getSetting('qrImageUrl'),
  }
  const allProducts = useMemo(
    () => categories.flatMap((category) => category.products),
    [categories],
  )
  const products = useMemo(() => {
    const source = categoryId === 'ALL'
      ? allProducts
      : categories.find((category) => category.id === categoryId)?.products ?? []
    const keyword = search.trim().toLowerCase()
    return source.filter((product) =>
      product.status !== 'INACTIVE'
      && (!keyword || product.name.toLowerCase().includes(keyword)),
    )
  }, [allProducts, categories, categoryId, search])

  const checkoutMutation = useMutation({
    mutationFn: orderApi.create,
    onSuccess: async (order) => {
      setPaymentDialogOpen(false)
      clearCart()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['current-shift'] }),
      ])
      toast.success(`Đơn #${order.queueNumber} đã chuyển sang Đang chuẩn bị`)
      navigate('/admin/orders?tab=UNFINISHED')
    },
    onError: (error: unknown) => {
      const message = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : null
      toast.error(message ?? 'Không thể tạo đơn hàng')
    },
  })

  const handleCheckout = () => {
    if (!currentShiftQuery.data?.data) {
      toast.error('Bạn chưa mở ca')
      return
    }
    if (items.length === 0) {
      toast.error('Giỏ hàng đang trống')
      return
    }
    // Mở dialog chọn phương thức thanh toán
    setPaymentDialogOpen(true)
  }

  const handleConfirmPayment = (receivedAmount?: number, paymentReference?: string) => {
    const request: OrderRequest = {
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      paymentMethod,
      receivedAmount,
      paymentReference,
      paymentConfirmed: true,
      note: note.trim() || undefined,
      items: items.map((item) => ({
        productId: item.productId,
        sizeId: item.sizeId,
        quantity: item.quantity,
        note: item.note,
        optionIds: item.options.map((option) => option.optionId),
      })),
    }
    checkoutMutation.mutate(request)
  }

  const openProduct = (product: PosProduct) => {
    if (product.status === 'SOLD_OUT') {
      toast.error('Món này đang tạm hết')
      return
    }
    setSelectedProduct(product)
    setCustomizationOpen(true)
  }

  return (
    <div className="-m-6 flex h-screen gap-4 overflow-hidden bg-muted/30 p-6">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-background shadow-sm">
        <header className="space-y-4 border-b p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Chọn món</h1>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-12 w-[320px] pl-11 text-base md:w-[400px]"
                placeholder="Tìm nhanh tên món..."
              />
            </div>
          </div>



          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              className="min-h-11 shrink-0 rounded-full px-5"
              variant={categoryId === 'ALL' ? 'default' : 'outline'}
              onClick={() => setCategoryId('ALL')}
            >
              Tất cả món
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                className="min-h-11 shrink-0 rounded-full px-5"
                variant={categoryId === category.id ? 'default' : 'outline'}
                onClick={() => setCategoryId(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {productsQuery.isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Utensils className="mb-3 h-12 w-12" />
              <p>Không tìm thấy món phù hợp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {products.map((product) => {
                const prices = product.variants.map((variant) => variant.price)
                const lowestPrice = prices.length ? Math.min(...prices) : product.basePrice
                return (
                  <button
                    type="button"
                    key={product.id}
                    onClick={() => openProduct(product)}
                    className={cn(
                      'group flex min-h-56 cursor-pointer flex-col overflow-hidden rounded-2xl border-2 bg-card text-left transition-colors hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      product.status === 'SOLD_OUT' && 'opacity-60 grayscale',
                    )}
                  >
                    <div className="relative aspect-[4/3] bg-muted">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Utensils className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                      )}
                      {product.status === 'SOLD_OUT' && (
                        <Badge variant="destructive" className="absolute left-3 top-3">Tạm hết</Badge>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h2 className="line-clamp-2 text-base font-bold">{product.name}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {product.variants.map((variant) => variant.size.name).join(' · ')}
                      </p>
                      <div className="mt-auto flex items-end justify-between pt-4">
                        <span>
                          <span className="block text-xs text-muted-foreground">Từ</span>
                          <span className="text-lg font-bold text-primary">{currency.format(lowestPrice)}</span>
                        </span>
                        <span className="rounded-full bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <ChevronRight className="h-5 w-5" />
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <aside className="flex w-[390px] shrink-0 flex-col overflow-hidden rounded-2xl border bg-background shadow-sm">
        <header className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
          <div className="flex items-center gap-2 text-lg font-bold">
            <ShoppingCart className="h-5 w-5" />
            Giỏ hàng
          </div>
          <Badge variant="secondary">
            {items.reduce((sum, item) => sum + item.quantity, 0)} phần
          </Badge>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-3">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <ShoppingCart className="mb-3 h-12 w-12 opacity-40" />
              <p>Chạm vào món để bắt đầu</p>
            </div>
          ) : (
            items.map((item) => {
              const unitTotal = item.unitPrice + item.options.reduce((sum, option) => sum + option.price, 0)
              return (
                <article key={item.id} className="rounded-xl border bg-card p-3 shadow-sm">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold">{item.productName}</h3>
                      <Badge variant="outline" className="mt-1">{item.sizeName}</Badge>
                      {item.options.length > 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {item.options.map((option) => option.optionName).join(', ')}
                        </p>
                      )}
                      {item.note && <p className="mt-1 text-xs font-medium text-amber-600">{item.note}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => item.quantity === 1
                          ? removeItem(item.id)
                          : updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center font-bold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="font-bold">{currency.format(unitTotal * item.quantity)}</span>
                  </div>
                </article>
              )
            })
          )}
        </div>

        <div className="space-y-3 border-t p-4">
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={customerName}
              onChange={(event) => setCustomerInfo(event.target.value, customerPhone)}
              placeholder="Tên khách"
            />
            <Input
              value={customerPhone}
              onChange={(event) => setCustomerInfo(customerName, event.target.value)}
              placeholder="Số điện thoại"
            />
          </div>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ghi chú chung cho đơn"
            className="min-h-16"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('CASH')}
            >
              Tiền mặt
            </Button>
            <Button
              variant={paymentMethod === 'TRANSFER' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('TRANSFER')}
            >
              Chuyển khoản
            </Button>
          </div>
          <div className="flex items-end justify-between border-t pt-3">
            <span className="font-semibold">Tổng thanh toán</span>
            <span className="text-2xl font-black text-primary">{currency.format(getTotalPrice())}</span>
          </div>
          <Button
            className="h-14 w-full text-base font-black"
            disabled={items.length === 0 || checkoutMutation.isPending}
            onClick={handleCheckout}
          >
            {checkoutMutation.isPending
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : 'THANH TOÁN'}
          </Button>
        </div>
      </aside>

      <ProductCustomizationDialog
        product={selectedProduct}
        options={options}
        open={customizationOpen}
        onOpenChange={setCustomizationOpen}
      />

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={(open) => {
          setPaymentDialogOpen(open)
          if (!open) checkoutMutation.reset()
        }}
        totalAmount={getTotalPrice()}
        paymentMethod={paymentMethod}
        transferConfig={transferConfig}
        onConfirm={handleConfirmPayment}
        isPending={checkoutMutation.isPending}
      />
    </div>
  )
}
