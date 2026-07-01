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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[620px] rounded-2xl">
        <div className="space-y-7 py-2">
          <section className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {product.variants.map((variant) => {
                const selected = variant.size.id === selectedSizeId
                return (
                  <button
                    type="button"
                    key={variant.id}
                    onClick={() => setSelectedSizeId(variant.size.id)}
                    className={cn(
                      'relative min-h-24 cursor-pointer rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected
                        ? 'border-emerald-pulse bg-emerald-pulse text-white'
                        : 'border-hairline bg-snow hover:border-emerald-pulse/60',
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
              <Label className="text-base font-bold">Topping</Label>
            </div>
            {options.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Chưa có topping đang hoạt động.
              </p>
            ) : (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
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
                        'flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition-all',
                        selected
                          ? 'border-jade-wash bg-mint-mist'
                          : 'border-hairline hover:border-jade-wash/60',
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

          {/* <div className="space-y-2">
            <Textarea
              id="item-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ghi chú món..."
              maxLength={500}
            />
          </div> */}

        </div>

        <DialogFooter className="flex items-center justify-between border-t pt-4 sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-6 text-center text-lg font-bold">{quantity}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setQuantity((value) => value + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button className="min-w-40 rounded-full text-base font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.05)]" onClick={handleAdd}>
              Thêm · {currency.format(total)}
            </Button>
          </div>
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
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2 text-lg font-semibold tracking-tight">
            {paymentMethod === 'CASH' ? (
              <><Banknote className="h-5 w-5 text-green-500" /> Thanh toán tiền mặt</>
            ) : (
              <><QrCode className="h-5 w-5 text-blue-500" /> Thanh toán chuyển khoản</>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Tổng tiền */}
          <div className="rounded-2xl bg-paper p-4 text-center">
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
                        'rounded-full border px-3 py-2 text-sm font-medium transition-all',
                        received === amount
                          ? 'border-emerald-pulse bg-emerald-pulse text-white'
                          : 'border-hairline hover:border-emerald-pulse/60',
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
                  'flex items-center justify-between rounded-2xl border p-3',
                  change >= 0 ? 'border-jade-wash/40 bg-mint-mist' : 'border-destructive/30 bg-red-50',
                )}>
                  <span className="font-semibold">Tiền thừa</span>
                  <span className={cn('text-xl font-bold', change >= 0 ? 'text-pine' : 'text-destructive')}>
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
            className="flex-1 h-12 rounded-full text-base font-semibold"
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
    <div className="flex h-[calc(100vh-1rem)] rounded-2xl bg-[#d2f2e7] p-3 text-[#022c22] sm:p-4">
      <div className="flex w-full gap-3 overflow-hidden">
        <section className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="space-y-4 rounded-2xl border border-[#e5e7eb] bg-white/90 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-black leading-none tracking-[-0.04em] text-[#022c22] sm:text-3xl">
                <ShoppingCart className="h-7 w-7 text-[#007a55]" />
                Chọn món
              </h1>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 w-[320px] rounded-full border-hairline pl-11 text-sm md:w-[400px]"
                placeholder="Tìm nhanh tên món..."
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              className="min-h-10 shrink-0 rounded-full px-5 text-sm"
              variant={categoryId === 'ALL' ? 'default' : 'outline'}
              onClick={() => setCategoryId('ALL')}
            >
              Tất cả 
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                className="min-h-10 shrink-0 rounded-full px-5 text-sm"
                variant={categoryId === category.id ? 'default' : 'outline'}
                onClick={() => setCategoryId(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-[#e5e7eb] bg-white/90 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {products.map((product) => {
                const prices = product.variants.map((variant) => variant.price)
                const lowestPrice = prices.length ? Math.min(...prices) : product.basePrice
                return (
                  <button
                    type="button"
                    key={product.id}
                    onClick={() => openProduct(product)}
                    className={cn(
                      'group flex cursor-pointer flex-col overflow-hidden rounded-[16px] border border-pale-sage bg-snow text-left transition-all hover:border-emerald-pulse hover:shadow-[0_4px_12px_rgba(0,188,125,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      product.status === 'SOLD_OUT' && 'opacity-60 grayscale',
                    )}
                  >
                    <div className="relative w-full pb-[100%] bg-paper overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Utensils className="h-10 w-10 text-graphite/40" />
                        </div>
                      )}
                      {product.status === 'SOLD_OUT' && (
                        <Badge variant="destructive" className="absolute left-2 top-2 z-10">Tạm hết</Badge>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3.5 pt-3">
                      <h2 className="line-clamp-2 text-[15px] font-bold leading-snug text-forest-ink">{product.name}</h2>
                      <div className="mt-1.5 flex items-end">
                        <span className="text-[16px] font-bold text-pine">{currency.format(lowestPrice)}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <aside className="flex w-[390px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white/90 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <header className="flex items-center justify-between bg-[#00bc7d] p-4 text-white">
          <div className="flex items-center gap-2 text-lg font-bold">
            <ShoppingCart className="h-5 w-5" />
            Giỏ hàng
          </div>
          <Badge variant="secondary">
            {items.reduce((sum, item) => sum + item.quantity, 0)} phần
          </Badge>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <ShoppingCart className="mb-3 h-12 w-12 opacity-40" />
              <p>Chạm vào món để bắt đầu</p>
            </div>
          ) : (
            items.map((item) => {
              const unitTotal = item.unitPrice + item.options.reduce((sum, option) => sum + option.price, 0)
              return (
                <article key={item.id} className="rounded-[16px] border border-hairline bg-snow p-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold leading-tight">{item.productName}</h3>
                        <span className="rounded-full border border-hairline bg-paper px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                          {item.sizeName}
                        </span>
                      </div>
                      
                      {item.options.length > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.options.map((option) => option.optionName).join(', ')}
                        </p>
                      )}
                      {item.note && <p className="mt-1 text-xs font-medium text-amber-600">{item.note}</p>}
                      
                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full border-hairline bg-paper hover:border-emerald-pulse hover:bg-snow"
                            onClick={() => item.quantity === 1
                              ? removeItem(item.id)
                              : updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full border-hairline bg-paper hover:border-emerald-pulse hover:bg-snow"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-[15px] font-bold text-pine">{currency.format(unitTotal * item.quantity)}</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="-mr-1 -mt-1 h-8 w-8 shrink-0 rounded-full text-destructive/60 hover:bg-red-50 hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </article>
              )
            })
          )}
        </div>

        <div className="space-y-3 border-t border-hairline p-4">
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
              className={cn(
                paymentMethod === 'CASH'
                  ? "border-transparent bg-emerald-pulse text-white hover:bg-emerald-pulse/90"
                  : "border-jade-wash text-pine hover:bg-mint-mist"
              )}
              variant="outline"
              onClick={() => setPaymentMethod('CASH')}
            >
              Tiền mặt
            </Button>
            <Button
              className={cn(
                paymentMethod === 'TRANSFER'
                  ? "border-transparent bg-emerald-pulse text-white hover:bg-emerald-pulse/90"
                  : "border-jade-wash text-pine hover:bg-mint-mist"
              )}
              variant="outline"
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
            className="h-14 w-full rounded-full text-base font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
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
    </div>
  )
}
