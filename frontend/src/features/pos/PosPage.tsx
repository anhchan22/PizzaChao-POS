import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Banknote,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Minus,
  Plus,
  QrCode,
  Search,
  ShoppingCart,
  Trash2,
  Utensils,
  X,
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
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
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
      <DialogContent className="max-h-[92vh] overflow-y-auto p-4 sm:p-6 sm:max-w-[620px] rounded-2xl">
        <div className="space-y-5 py-1 md:space-y-7 md:py-2">
          <section className="space-y-3">
            <div className="grid gap-2 grid-cols-3">
              {product.variants.map((variant) => {
                const selected = variant.size.id === selectedSizeId
                return (
                  <button
                    type="button"
                    key={variant.id}
                    onClick={() => setSelectedSizeId(variant.size.id)}
                    className={cn(
                      'relative min-h-16 md:min-h-24 cursor-pointer rounded-xl md:rounded-2xl border p-2.5 md:p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected
                        ? 'border-emerald-pulse bg-emerald-pulse text-white'
                        : 'border-hairline bg-snow hover:border-emerald-pulse/60',
                    )}
                  >
                    {selected && (
                      <span className="absolute right-1.5 top-1.5 md:right-3 md:top-3 rounded-full bg-primary-foreground/20 p-0.5 md:p-1">
                        <Check className="h-3 w-3 md:h-4 md:w-4" />
                      </span>
                    )}
                    <p className="text-sm md:text-lg font-bold">{variant.size.name}</p>
                    <p className={cn('mt-1 md:mt-2 text-xs md:text-base font-semibold', !selected && 'text-primary')}>
                      {currency.format(variant.price)}
                    </p>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <Label className="text-sm md:text-base font-bold">Topping</Label>
            </div>
            {options.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Chưa có topping đang hoạt động.
              </p>
            ) : (
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
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
                        'flex min-h-12 md:min-h-16 cursor-pointer items-center gap-2 md:gap-3 rounded-xl md:rounded-2xl border p-2 md:p-3 text-left transition-all',
                        selected
                          ? 'border-jade-wash bg-mint-mist'
                          : 'border-hairline hover:border-jade-wash/60',
                      )}
                    >
                      <Checkbox checked={selected} tabIndex={-1} className="h-4 w-4" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs md:text-sm font-semibold truncate">{option.name}</span>
                        <span className="text-[10px] md:text-xs text-muted-foreground">
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

        <div className="flex items-center justify-between gap-2 border-t pt-4">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 md:h-10 md:w-10 rounded-full"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            >
              <Minus className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
            <span className="w-5 text-center text-sm md:text-lg font-bold">{quantity}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 md:h-10 md:w-10 rounded-full"
              onClick={() => setQuantity((value) => value + 1)}
            >
              <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <Button variant="outline" className="h-8 md:h-10 text-xs md:text-sm px-3 md:px-4 rounded-full" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button className="h-8 md:h-10 text-xs md:text-sm px-4 md:px-6 rounded-full font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.05)] min-w-[120px] md:min-w-[160px]" onClick={handleAdd}>
              Thêm · {currency.format(total)}
            </Button>
          </div>
        </div>
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
      <DialogContent className="p-4 sm:p-6 sm:max-w-md rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-1.5 md:gap-2 text-base md:text-lg font-semibold tracking-tight">
            {paymentMethod === 'CASH' ? (
              <><Banknote className="h-4.5 w-4.5 md:h-5 md:w-5 text-green-500" /> Thanh toán tiền mặt</>
            ) : (
              <><QrCode className="h-4.5 w-4.5 md:h-5 md:w-5 text-blue-500" /> Thanh toán chuyển khoản</>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 py-1 md:space-y-5 md:py-2">
          {/* Tổng tiền */}
          <div className="rounded-xl md:rounded-2xl bg-paper p-2.5 md:p-4 text-center">
            <p className="text-xs md:text-sm text-muted-foreground">Tổng cần thanh toán</p>
            <p className="mt-0.5 md:mt-1 text-xl md:text-3xl font-black text-primary">{currency.format(totalAmount)}</p>
          </div>

          {paymentMethod === 'CASH' ? (
            <>
              {/* Các mệnh giá nhanh */}
              <div>
                <p className="mb-1.5 text-xs md:text-sm font-semibold">Chọn nhanh mệnh giá</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {QUICK_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setReceivedInput(String(amount))}
                      className={cn(
                        'rounded-full border px-2 py-1 text-xs md:text-sm font-medium transition-all',
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
                <Label htmlFor="received-amount" className="text-xs md:text-sm">Khách đưa (VNĐ)</Label>
                <Input
                  id="received-amount"
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="Nhập số tiền khách đưa..."
                  value={receivedInput}
                  onChange={(e) => setReceivedInput(e.target.value)}
                  className="h-9 md:h-12 text-sm md:text-lg font-semibold"
                  autoFocus
                />
              </div>

              {/* Tiền thừa */}
              {received > 0 && (
                <div className={cn(
                  'flex items-center justify-between rounded-xl md:rounded-2xl border p-2 md:p-3',
                  change >= 0 ? 'border-jade-wash/40 bg-mint-mist' : 'border-destructive/30 bg-red-50',
                )}>
                  <span className="text-xs md:text-sm font-semibold">Tiền thừa</span>
                  <span className={cn('text-base md:text-xl font-bold', change >= 0 ? 'text-pine' : 'text-destructive')}>
                    {change >= 0 ? currency.format(change) : `Thiếu ${currency.format(-change)}`}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3.5">
              {qrUrl ? (
                <div className="flex flex-col items-center gap-2 md:gap-3 rounded-xl border bg-white p-2.5 md:p-4 text-center text-slate-900">
                  <img
                    src={qrUrl}
                    alt="Mã QR chuyển khoản"
                    className="h-44 w-44 md:h-64 md:w-64 rounded-lg object-contain"
                  />
                  <div className="text-xs md:text-sm">
                    <p className="font-black">{transferConfig.storeName || transferConfig.accountName || 'CHAO NGON'}</p>
                    {transferConfig.accountNo && (
                      <p className="mt-0.5">STK: <strong>{transferConfig.accountNo}</strong></p>
                    )}
                    {transferConfig.accountName && (
                      <p className="mt-0.5">Chủ TK: <strong>{transferConfig.accountName}</strong></p>
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

        <div className="flex items-center gap-2 border-t pt-4">
          <Button variant="outline" className="h-9 md:h-10 text-xs md:text-sm rounded-full px-4" onClick={() => onOpenChange(false)} disabled={isPending}>
            Hủy
          </Button>
          <Button
            className="flex-1 h-9 md:h-12 rounded-full text-xs md:text-base font-semibold"
            disabled={!canConfirm || isPending}
            onClick={() => onConfirm(
              paymentMethod === 'CASH' ? received : undefined,
              paymentMethod === 'TRANSFER' ? transferReference : undefined,
            )}
          >
            {isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : 'Xác Nhận'
            }
          </Button>
        </div>
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
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<PosProduct | null>(null)
  const [customizationOpen, setCustomizationOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
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
    () => categories.flatMap((category) => 
      category.products.map(p => ({ ...p, categoryId: category.id }))
    ),
    [categories],
  )
  const products = useMemo(() => {
    let filtered = categoryId === 'ALL'
      ? allProducts
      : (categories.find((category) => category.id === categoryId)?.products ?? []).map(p => ({ ...p, categoryId }))
    filtered = filtered.filter((p) => p.status !== 'INACTIVE')
    if (search.trim()) {
      const lowerSearch = search.toLowerCase()
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(lowerSearch))
    }
    return filtered
  }, [allProducts, categories, categoryId, search])

  const groupedProducts = useMemo(() => {
    const groups: Record<number, PosProduct[]> = {}
    products.forEach(p => {
      const catId = (p as any).categoryId
      if (catId !== undefined) {
        if (!groups[catId]) groups[catId] = []
        groups[catId].push(p)
      }
    })
    return groups
  }, [products])

  const toggleCategory = (catId: number) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const checkoutMutation = useMutation({
    mutationFn: orderApi.create,
    onSuccess: async (order) => {
      setPaymentDialogOpen(false)
      clearCart()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['current-shift'] }),
        queryClient.invalidateQueries({ queryKey: ['report-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['recent-orders'] }),
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

  const cartContent = (
    <>
      <header className="flex items-center justify-between bg-[#00bc7d] p-2.5 lg:p-4 text-white shrink-0">
        <div className="flex items-center gap-1.5 lg:gap-2 text-sm lg:text-lg font-bold">
          <ShoppingCart className="h-4 w-4 lg:h-5 w-5" />
          Giỏ hàng
        </div>
        <div className="flex items-center gap-1.5 lg:gap-2">
          <Badge variant="secondary" className="text-[10px] lg:text-xs">
            {items.reduce((sum, item) => sum + item.quantity, 0)} phần
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20 rounded-full lg:hidden"
            onClick={() => setIsCartOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 space-y-1.5 lg:space-y-3 overflow-y-auto p-2 lg:p-3 bg-white/90">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <ShoppingCart className="mb-3 h-10 w-10 lg:h-12 lg:w-12 opacity-40" />
            <p className="text-sm">Chạm vào món để bắt đầu</p>
          </div>
        ) : (
          items.map((item) => {
            const unitTotal = item.unitPrice + item.options.reduce((sum, option) => sum + option.price, 0)
            return (
              <article key={item.id} className="rounded-xl lg:rounded-[16px] border border-hairline bg-snow p-2 lg:p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 lg:gap-2">
                      <h3 className="text-sm lg:text-base font-bold leading-tight truncate">{item.productName}</h3>
                      <span className="rounded-full border border-hairline bg-paper px-1.5 py-0 text-[10px] lg:text-[11px] font-semibold text-muted-foreground">
                        {item.sizeName}
                      </span>
                    </div>
                    
                    {item.options.length > 0 && (
                      <p className="mt-0.5 lg:mt-1 text-[11px] lg:text-xs text-muted-foreground">
                        {item.options.map((option) => option.optionName).join(', ')}
                      </p>
                    )}
                    {item.note && <p className="mt-0.5 lg:mt-1 text-[11px] lg:text-xs font-medium text-amber-600">{item.note}</p>}
                    
                    <div className="mt-2 lg:mt-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 lg:h-7 lg:w-7 rounded-full border-hairline bg-paper hover:border-emerald-pulse hover:bg-snow"
                          onClick={() => item.quantity === 1
                            ? removeItem(item.id)
                            : updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                        </Button>
                        <span className="w-5 lg:w-6 text-center text-xs lg:text-sm font-bold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 lg:h-7 lg:w-7 rounded-full border-hairline bg-paper hover:border-emerald-pulse hover:bg-snow"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                        </Button>
                      </div>
                      <span className="text-[13px] lg:text-[15px] font-bold text-pine">{currency.format(unitTotal * item.quantity)}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="-mr-1 -mt-1 h-7 w-7 lg:h-8 lg:w-8 shrink-0 rounded-full text-destructive/60 hover:bg-red-50 hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                  </Button>
                </div>
              </article>
            )
          })
        )}
      </div>

      <div className="space-y-1.5 lg:space-y-3 border-t border-hairline p-2.5 lg:p-4 bg-white shrink-0 pb-[env(safe-area-inset-bottom,1rem)]">
        <div className="grid grid-cols-2 gap-1.5">
          <Input
            value={customerName}
            onChange={(event) => setCustomerInfo(event.target.value, customerPhone)}
            placeholder="Tên khách"
            className="h-8 lg:h-10 text-[11px] lg:text-sm"
          />
          <Input
            value={customerPhone}
            onChange={(event) => setCustomerInfo(customerName, event.target.value)}
            placeholder="Số điện thoại"
            className="h-8 lg:h-10 text-[11px] lg:text-sm"
          />
        </div>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ghi chú chung cho đơn"
          className="min-h-10 lg:min-h-16 text-[11px] lg:text-sm p-2"
        />
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            className={cn(
              "h-8 lg:h-10 text-[11px] lg:text-sm",
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
              "h-8 lg:h-10 text-[11px] lg:text-sm",
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
        <div className="flex items-end justify-between border-t pt-1.5 lg:pt-3">
          <span className="text-xs lg:text-base font-semibold">Tổng thanh toán</span>
          <span className="text-lg lg:text-2xl font-black text-primary">{currency.format(getTotalPrice())}</span>
        </div>
        <Button
          className="h-10 lg:h-14 w-full rounded-full text-xs lg:text-base font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          disabled={items.length === 0 || checkoutMutation.isPending}
          onClick={handleCheckout}
        >
          {checkoutMutation.isPending
            ? <Loader2 className="h-5 w-5 animate-spin" />
            : 'THANH TOÁN'}
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex h-[calc(100dvh-4.5rem)] lg:h-[calc(100vh-1.5rem)] rounded-2xl bg-[#d2f2e7] p-2 text-[#022c22] sm:p-3 lg:p-4 relative">
      <div className="flex w-full gap-3 overflow-hidden">
        <section className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="space-y-4 rounded-2xl border border-[#e5e7eb] bg-white/90 p-3 lg:p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="hidden md:block">
              <h1 className="flex items-center gap-2 text-2xl font-black leading-none tracking-[-0.04em] text-[#022c22] sm:text-3xl">
                <ShoppingCart className="h-7 w-7 text-[#007a55]" />
                Chọn món
              </h1>
            </div>
            
            <div className="relative w-full lg:w-auto">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 w-full lg:w-[320px] rounded-full border-hairline pl-11 text-sm xl:w-[400px]"
                placeholder="Tìm nhanh tên món..."
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              className="h-8 md:h-10 shrink-0 rounded-full px-3 md:px-5 text-xs md:text-sm"
              variant={categoryId === 'ALL' ? 'default' : 'outline'}
              onClick={() => setCategoryId('ALL')}
            >
              Tất cả 
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                className="h-8 md:h-10 shrink-0 rounded-full px-3 md:px-5 text-xs md:text-sm"
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
            <div className="space-y-6">
              {categories
                .filter(category => groupedProducts[category.id] && groupedProducts[category.id].length > 0)
                .map(category => {
                  const categoryProducts = groupedProducts[category.id]
                  const isCollapsed = collapsedCategories.has(category.id)
                  
                  return (
                    <div key={category.id} className="space-y-3">
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="flex w-full items-center justify-between rounded-xl bg-[#00bc7d]/10 px-4 py-2 text-[#007a55] transition-colors hover:bg-[#00bc7d]/20"
                      >
                        <h2 className="text-lg font-bold">
                          {category.name} <span className="text-sm font-normal opacity-80">({categoryProducts.length})</span>
                        </h2>
                        {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                      </button>
                      
                      {!isCollapsed && (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                          {categoryProducts.map((product) => {
                            const prices = product.variants.map((variant) => variant.price)
                            const lowestPrice = prices.length ? Math.min(...prices) : product.basePrice
                            return (
                              <button
                                type="button"
                                key={product.id}
                                onClick={() => openProduct(product)}
                                className={cn(
                                  'group flex cursor-pointer overflow-hidden rounded-[12px] md:rounded-[16px] border border-pale-sage bg-snow text-left transition-all hover:border-emerald-pulse hover:shadow-[0_4px_12px_rgba(0,188,125,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                  'flex-row md:flex-col',
                                  product.status === 'SOLD_OUT' && 'opacity-60 grayscale',
                                )}
                              >
                                <div className="relative shrink-0 bg-paper overflow-hidden h-16 w-16 sm:h-20 sm:w-20 md:h-auto md:w-full md:pb-[100%]">
                                  {product.imageUrl ? (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.name}
                                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Utensils className="h-5 w-5 md:h-10 md:w-10 text-graphite/40" />
                                    </div>
                                  )}
                                  {product.status === 'SOLD_OUT' && (
                                    <Badge variant="destructive" className="absolute left-0.5 top-0.5 md:left-2 md:top-2 z-10 text-[8px] md:text-xs px-1 py-0.2">Tạm hết</Badge>
                                  )}
                                </div>
                                <div className="flex flex-1 flex-col p-1.5 md:p-3.5 md:pt-3 justify-center md:justify-start min-w-0">
                                  <h2 className="line-clamp-2 text-[12px] md:text-[15px] font-bold leading-tight text-forest-ink">{product.name}</h2>
                                  <div className="mt-0.5 md:mt-1.5 flex items-end justify-between">
                                    <span className="text-[13px] md:text-[16px] font-bold text-pine">{currency.format(lowestPrice)}</span>
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-pulse text-white md:hidden">
                                      <Plus className="h-2.5 w-2.5" />
                                    </div>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </section>

      {/* Desktop Cart */}
      <aside className="hidden lg:flex w-[390px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white/90 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        {cartContent}
      </aside>

      {/* Mobile Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="bottom" className="!h-[87dvh] p-0 flex flex-col rounded-t-[24px] overflow-hidden" showCloseButton={false}>
          <SheetTitle className="sr-only">Giỏ hàng</SheetTitle>
          {cartContent}
        </SheetContent>
      </Sheet>

      {/* Mobile Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <Button
          className="relative h-14 w-14 rounded-full shadow-lg border-transparent bg-emerald-pulse text-white hover:bg-emerald-pulse/90"
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingCart className="h-6 w-6" />
          {items.length > 0 && (
            <Badge className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full p-0 bg-red-500 text-white border-white">
              {items.reduce((sum, item) => sum + item.quantity, 0)}
            </Badge>
          )}
        </Button>
      </div>

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
