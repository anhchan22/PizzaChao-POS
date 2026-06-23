import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productApi, optionApi } from '@/apis/product.api'
import type { PosProduct, ProductOption } from '@/types'
import { useCartStore } from '@/stores/cartStore'
import { Loader2, Minus, Plus, ShoppingCart, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { orderApi } from '@/apis/order.api'
import type { OrderRequest } from '@/apis/order.api'
import { shiftApi } from '../shift/api/shift.api'
import { settingApi } from '../settings/api/setting.api'
import type { Shift } from '../shift/types/shift.types'
import type { Setting } from '../settings/types/setting.types'
import { useNavigate } from 'react-router-dom'

// Modal Component cho việc chọn Size và Topping
function ProductCustomizationModal({
  product,
  open,
  onOpenChange,
  options: allOptions,
}: {
  product: PosProduct | null
  open: boolean
  onOpenChange: (open: boolean) => void
  options: ProductOption[]
}) {
  const addItem = useCartStore(state => state.addItem)

  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null)
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([])
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')

  // Khi modal mở với sản phẩm mới, tự động chọn size đầu tiên
  useMemo(() => {
    if (open && product) {
      if (product.variants.length > 0) {
        setSelectedSizeId(product.variants[0].size.id)
      }
      setSelectedOptionIds([])
      setQuantity(1)
      setNote('')
    }
  }, [open, product])

  if (!product) return null

  const handleAddToCart = () => {
    if (!selectedSizeId) {
      toast.error('Vui lòng chọn kích cỡ')
      return
    }

    const variant = product.variants.find(v => v.size.id === selectedSizeId)
    if (!variant) return

    const selectedOptions = allOptions
      .filter(o => selectedOptionIds.includes(o.id))
      .map(o => ({
        optionId: o.id,
        optionName: o.name,
        price: o.price
      }))

    addItem({
      productId: product.id,
      productName: product.name,
      sizeId: variant.size.id,
      sizeName: variant.size.name,
      unitPrice: variant.price,
      quantity,
      note,
      options: selectedOptions
    })

    toast.success(`Đã thêm ${product.name} vào giỏ`)
    onOpenChange(false)
  }

  const selectedVariant = product.variants.find(v => v.size.id === selectedSizeId)
  const basePrice = selectedVariant?.price || 0
  const optionsPrice = allOptions
    .filter(o => selectedOptionIds.includes(o.id))
    .reduce((sum, o) => sum + o.price, 0)
  
  const totalPrice = (basePrice + optionsPrice) * quantity

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Sizes */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Chọn kích cỡ <span className="text-destructive">*</span></Label>
            <RadioGroup 
              value={selectedSizeId?.toString()} 
              onValueChange={(val) => setSelectedSizeId(Number(val))}
              className="grid grid-cols-2 gap-3"
            >
              {product.variants.map((v) => (
                <div key={v.id} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={v.size.id.toString()} id={`size-${v.id}`} />
                  <Label htmlFor={`size-${v.id}`} className="flex-1 cursor-pointer flex justify-between">
                    <span>{v.size.name}</span>
                    <span className="font-semibold">{v.price.toLocaleString('vi-VN')}đ</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Options (Toppings) */}
          {allOptions.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Topping (Tuỳ chọn)</Label>
              <div className="grid grid-cols-2 gap-3">
                {allOptions.map(opt => (
                  <div key={opt.id} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox 
                      id={`opt-${opt.id}`} 
                      checked={selectedOptionIds.includes(opt.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedOptionIds(p => [...p, opt.id])
                        else setSelectedOptionIds(p => p.filter(id => id !== opt.id))
                      }}
                    />
                    <Label htmlFor={`opt-${opt.id}`} className="flex-1 cursor-pointer flex justify-between">
                      <span>{opt.name}</span>
                      <span className="text-muted-foreground">+{opt.price.toLocaleString('vi-VN')}đ</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Ghi chú cho món này</Label>
            <Input 
              placeholder="VD: Ít đá, không hành..." 
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between pt-2">
            <Label className="text-base font-semibold">Số lượng</Label>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold text-lg">{quantity}</span>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleAddToCart} className="min-w-[150px]">
            Thêm - {totalPrice.toLocaleString('vi-VN')}đ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main POS Page ──────────────────────────────────────────────────
export default function PosPage() {
  const { items, customerName, customerPhone, note, removeItem, updateQuantity, setCustomerInfo, clearCart, getTotalPrice } = useCartStore()
  
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<PosProduct | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Shift state
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const navigate = useNavigate()

  // QR Modal state
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const [orderTotal, setOrderTotal] = useState(0)

  // Fetch Current Shift
  const { data: shiftData, isError: isShiftError } = useQuery({
    queryKey: ['current-shift'],
    queryFn: shiftApi.getCurrentShift,
    retry: false
  })

  // Fetch Settings for VietQR
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: settingApi.getAllSettings
  })

  useEffect(() => {
    if (isShiftError || (shiftData && !shiftData.data)) {
      toast.error('Vui lòng mở ca trước khi vào máy POS')
      navigate('/dashboard', { replace: true })
    } else if (shiftData?.data) {
      setActiveShift(shiftData.data)
    }
  }, [shiftData, isShiftError, navigate])

  // Fetch POS data
  const { data: categories = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['pos-products'],
    queryFn: productApi.getPosData,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch active options
  const { data: options = [] } = useQuery({
    queryKey: ['active-options'],
    queryFn: () => optionApi.getAll().then(res => res.filter(o => o.isActive))
  })

  // Set default category
  useMemo(() => {
    if (categories.length > 0 && activeCategoryId === null) {
      setActiveCategoryId(categories[0].id)
    }
  }, [categories, activeCategoryId])

  const handleProductClick = (product: PosProduct) => {
    if (product.status === 'SOLD_OUT') {
      toast.error('Sản phẩm đã hết hàng')
      return
    }
    if (product.status === 'INACTIVE') return
    
    setSelectedProduct(product)
    setModalOpen(true)
  }

  const handleCheckout = async () => {
    if (!activeShift) {
      toast.error('Vui lòng đợi tải thông tin ca')
      return
    }

    if (items.length === 0) {
      toast.error('Giỏ hàng trống')
      return
    }

    setIsCheckingOut(true)
    try {
      const orderRequest: OrderRequest = {
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        paymentMethod,
        note: note || undefined,
        items: items.map(item => ({
          productId: item.productId,
          sizeId: item.sizeId,
          quantity: item.quantity,
          note: item.note,
          optionIds: item.options.map(o => o.optionId)
        }))
      }

      await orderApi.create(orderRequest)
      const total = getTotalPrice()
      
      if (paymentMethod === 'TRANSFER') {
        const bankIdSetting = settingsData?.data?.find((s: Setting) => s.key === 'bankId')?.value
        const accountNoSetting = settingsData?.data?.find((s: Setting) => s.key === 'accountNo')?.value
        const accountNameSetting = settingsData?.data?.find((s: Setting) => s.key === 'accountName')?.value

        if (bankIdSetting && accountNoSetting) {
          const qr = `https://img.vietqr.io/image/${bankIdSetting}-${accountNoSetting}-compact2.jpg?amount=${total}&addInfo=Thanh toan don hang&accountName=${accountNameSetting || ''}`
          setQrUrl(qr)
          setOrderTotal(total)
          setQrModalOpen(true)
        } else {
          toast.warning('Chưa cấu hình ngân hàng. Vui lòng kiểm tra lại cài đặt.')
        }
      } else {
        toast.success('Thanh toán thành công! Đã tạo đơn hàng.')
      }
      
      clearCart()
      setPaymentMethod('CASH')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Thanh toán thất bại')
    } finally {
      setIsCheckingOut(false)
    }
  }

  const activeCategory = categories.find(c => c.id === activeCategoryId)
  const filteredProducts = activeCategory?.products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4 overflow-hidden -mx-2 -my-4 p-2">
      
      {/* ─── Left Column: Menu ─── */}
      <div className="flex-1 flex flex-col min-w-0 bg-background rounded-lg border shadow-sm overflow-hidden">
        
        {/* Categories Tab and Search */}
        <div className="flex flex-col border-b shrink-0 bg-muted/10">
          <div className="p-3 pb-0 flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm món ăn..."
                className="pl-9 h-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {activeShift && (
              <Badge variant="outline" className="h-6 bg-background">
                Ca: {activeShift.openedByName}
              </Badge>
            )}
          </div>
          <div className="flex overflow-x-auto p-3 gap-2 hide-scrollbar">
            {isLoadingProducts ? (
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-24 bg-muted animate-pulse rounded-full" />)}
              </div>
            ) : (
              categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={activeCategoryId === cat.id ? 'default' : 'outline'}
                  className="rounded-full whitespace-nowrap"
                  onClick={() => setActiveCategoryId(cat.id)}
                >
                  {cat.name}
                </Button>
              ))
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-muted/5">
          {isLoadingProducts ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-center px-4">
              <p>Chưa có sản phẩm nào.<br/>Vui lòng thêm Danh mục và Sản phẩm trong phần Thực đơn.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map(prod => (
                <div 
                  key={prod.id} 
                  className={`
                    relative group bg-card rounded-xl border overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-md hover:border-primary/50
                    ${prod.status === 'SOLD_OUT' ? 'opacity-60 grayscale' : ''}
                  `}
                  onClick={() => handleProductClick(prod)}
                >
                  <div className="aspect-square bg-muted relative">
                    {prod.imageUrl ? (
                      <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                    )}
                    {prod.status === 'SOLD_OUT' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Badge variant="destructive" className="text-lg">Hết món</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">{prod.name}</h3>
                    <div className="mt-auto font-bold text-primary">
                      {prod.basePrice.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Right Column: Cart ─── */}
      <div className="w-[380px] shrink-0 flex flex-col bg-background rounded-lg border shadow-sm overflow-hidden">
        
        {/* Cart Header */}
        <div className="p-4 border-b bg-primary text-primary-foreground flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <ShoppingCart className="h-5 w-5" />
            <span>Giỏ hàng</span>
          </div>
          <Badge variant="secondary" className="font-mono text-sm px-2">
            {items.reduce((acc, i) => acc + i.quantity, 0)} món
          </Badge>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/10">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-3">
              <ShoppingCart className="h-12 w-12" />
              <p>Chưa có món nào</p>
            </div>
          ) : (
            items.map(item => {
              const optionsTotal = item.options.reduce((sum, o) => sum + o.price, 0)
              const unitTotal = item.unitPrice + optionsTotal
              return (
                <div key={item.id} className="bg-card p-3 rounded-lg border shadow-sm relative group">
                  <div className="flex justify-between items-start mb-2 pr-6">
                    <div>
                      <div className="font-semibold text-sm">{item.productName} ({item.sizeName})</div>
                      {item.options.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          + {item.options.map(o => o.optionName).join(', ')}
                        </div>
                      )}
                      {item.note && (
                        <div className="text-xs text-amber-600 mt-0.5 font-medium">
                          Lưu ý: {item.note}
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-sm text-right shrink-0">
                      {(unitTotal * item.quantity).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-muted-foreground">
                      {unitTotal.toLocaleString('vi-VN')}đ / phần
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })
          )}
        </div>

        {/* Customer Info & Checkout */}
        <div className="p-4 border-t bg-card shrink-0 space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input 
                placeholder="Tên khách" 
                className="h-9 text-sm" 
                value={customerName} 
                onChange={e => setCustomerInfo(e.target.value, customerPhone)} 
              />
              <Input 
                placeholder="SĐT" 
                className="h-9 text-sm" 
                value={customerPhone} 
                onChange={e => setCustomerInfo(customerName, e.target.value)} 
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant={paymentMethod === 'CASH' ? 'default' : 'outline'} 
                className="flex-1 h-9 text-xs"
                onClick={() => setPaymentMethod('CASH')}
              >
                Tiền mặt
              </Button>
              <Button 
                variant={paymentMethod === 'TRANSFER' ? 'default' : 'outline'} 
                className="flex-1 h-9 text-xs"
                onClick={() => setPaymentMethod('TRANSFER')}
              >
                Chuyển khoản
              </Button>
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-lg">Tổng thanh toán:</span>
              <span className="text-2xl font-bold text-primary">
                {getTotalPrice().toLocaleString('vi-VN')}đ
              </span>
            </div>
            <Button 
              className="w-full h-12 text-base font-bold shadow-md" 
              onClick={handleCheckout}
              disabled={isCheckingOut || items.length === 0}
            >
              {isCheckingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : 'THANH TOÁN'}
            </Button>
          </div>
        </div>

      </div>

      {/* Modals */}
      <ProductCustomizationModal 
        product={selectedProduct} 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        options={options}
      />

      {/* VietQR Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-center">Thanh toán chuyển khoản</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            {qrUrl ? (
              <div className="bg-white p-2 rounded-xl shadow-sm border">
                <img src={qrUrl} alt="VietQR" className="w-64 h-64 object-contain" />
              </div>
            ) : (
              <div className="w-64 h-64 bg-muted flex items-center justify-center rounded-xl">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">Số tiền cần thanh toán</p>
              <p className="text-2xl font-bold text-primary">{orderTotal.toLocaleString('vi-VN')}đ</p>
            </div>
            <div className="text-sm text-center text-muted-foreground px-4">
              Vui lòng yêu cầu khách hàng quét mã QR trên ứng dụng ngân hàng để thanh toán.
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => setQrModalOpen(false)}>
              Hoàn thành
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
