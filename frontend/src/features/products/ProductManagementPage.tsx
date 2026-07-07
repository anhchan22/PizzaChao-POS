import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productApi, categoryApi, sizeApi, uploadApi } from "@/apis/product.api"
import type { Product, ProductRequest, VariantRequest, ProductStatus } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { ArrowDown, ArrowUp, ArrowUpDown, EditIcon, Pizza, PlusIcon, TrashIcon, UploadIcon } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"

type SoldQuantitySort = 'none' | 'desc' | 'asc'

export default function ProductManagementPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const isOwner = user?.role === 'OWNER'
  const [isOpen, setIsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Product | null>(null)
  
  // Form state
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [basePrice, setBasePrice] = useState(0)
  const [imageUrl, setImageUrl] = useState('')
  const [status, setStatus] = useState<ProductStatus>('ACTIVE')
  const [variants, setVariants] = useState<VariantRequest[]>([])
  const [enabledSizeIds, setEnabledSizeIds] = useState<number[]>([])
  const [soldQuantitySort, setSoldQuantitySort] = useState<SoldQuantitySort>('none')

  const { data: products = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: productApi.getAll })
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoryApi.getAll })
  const { data: sizes = [] } = useQuery({ queryKey: ["sizes"], queryFn: sizeApi.getAll })

  const sortedProducts = useMemo(() => {
    if (soldQuantitySort === 'none') {
      return products
    }

    return [...products].sort((a, b) => {
      const first = a.soldQuantity ?? 0
      const second = b.soldQuantity ?? 0
      return soldQuantitySort === 'desc' ? second - first : first - second
    })
  }, [products, soldQuantitySort])

  const toggleSoldQuantitySort = () => {
    setSoldQuantitySort((current) => {
      if (current === 'none') return 'desc'
      if (current === 'desc') return 'asc'
      return 'none'
    })
  }

  const createMutation = useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["pos-products"] })
      toast.success("Tạo món thành công")
      setIsOpen(false)
    },
    onError: () => toast.error("Có lỗi xảy ra")
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: ProductRequest }) => productApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["pos-products"] })
      toast.success("Cập nhật món thành công")
      setIsOpen(false)
    },
    onError: () => toast.error("Có lỗi xảy ra")
  })

  const deleteMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["pos-products"] })
      toast.success("Xóa món thành công")
    },
    onError: () => toast.error("Không thể xóa món này")
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    try {
      const url = await uploadApi.uploadImage(file)
      setImageUrl(url)
    } catch (err) {
      toast.error("Upload ảnh thất bại")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId) return toast.error("Vui lòng chọn danh mục")
    
    const activeVariants = variants.filter(v => enabledSizeIds.includes(v.sizeId))
    const requestData: ProductRequest = {
      categoryId: Number(categoryId),
      name,
      description,
      basePrice,
      imageUrl,
      status,
      variants: activeVariants
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: requestData })
    } else {
      createMutation.mutate(requestData)
    }
  }

  const openNew = () => {
    setEditingItem(null)
    setCategoryId('')
    setName('')
    setDescription('')
    setBasePrice(0)
    setImageUrl('')
    setStatus('ACTIVE')
    // Auto generate variants based on existing sizes
    setVariants(sizes.map(s => ({ sizeId: s.id, price: 0 })))
    setEnabledSizeIds(sizes.map(s => s.id)) // enable all sizes by default
    setIsOpen(true)
  }

  const openEdit = (prod: Product) => {
    setEditingItem(prod)
    setCategoryId(prod.category.id)
    setName(prod.name)
    setDescription(prod.description || '')
    setBasePrice(prod.basePrice)
    setImageUrl(prod.imageUrl || '')
    setStatus(prod.status)
    
    // Merge existing variants with all sizes
    const existingVariants = prod.variants.map(v => ({ sizeId: v.size.id, price: v.price }))
    const mergedVariants = sizes.map(s => {
      const existing = existingVariants.find(ev => ev.sizeId === s.id)
      return existing ? existing : { sizeId: s.id, price: prod.basePrice }
    })
    setVariants(mergedVariants)
    setEnabledSizeIds(prod.variants.map(v => v.size.id)) // enable only existing variants
    
    setIsOpen(true)
  }

  const handleVariantPriceChange = (sizeId: number, price: number) => {
    setVariants(prev => prev.map(v => v.sizeId === sizeId ? { ...v, price } : v))
  }

  return (
    <div className="min-h-[calc(100vh-1.5rem)] rounded-2xl bg-[#d2f2e7] p-3 text-[#022c22] sm:p-4">
      <div className="space-y-4 md:space-y-6 rounded-2xl border border-[#e5e7eb] bg-white/90 p-3 md:p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-1.5 text-s font-black leading-none tracking-[-0.04em] text-[#022c22] sm:text-3xl">
            <Pizza className="h-4 w-4 sm:h-7 sm:w-7 text-[#007a55]" />
            Món ăn
          </h1>
          {isOwner && (
            <Button onClick={openNew} size="sm" className="h-7 rounded-full text-[10px] font-bold bg-[#00bc7d] text-white hover:bg-[#007a55] sm:h-10 sm:px-4 sm:text-sm px-2.5">
              <PlusIcon className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              Thêm Món
            </Button>
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-[#e5e7eb]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-[#022c22] border-b border-[#022c22]">
                <TableHead className="w-16 font-bold text-white">Ảnh</TableHead>
                <TableHead className="font-bold text-white">Tên món</TableHead>
                <TableHead className="font-bold text-white">Danh mục</TableHead>
                <TableHead className="font-bold text-white">Giá gốc</TableHead>
                <TableHead className="font-bold text-white">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 border-0 bg-transparent p-0 font-bold text-white outline-none hover:text-white focus-visible:outline-none"
                    onClick={toggleSoldQuantitySort}
                  >
                    ĐÃ BÁN
                    {soldQuantitySort === 'desc' ? (
                      <ArrowDown className="h-3.5 w-3.5 text-white" />
                    ) : soldQuantitySort === 'asc' ? (
                      <ArrowUp className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="font-bold text-white">Trạng thái</TableHead>
                {isOwner && <TableHead className="text-right font-bold text-white">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={isOwner ? 7 : 6} className="text-center py-8">Đang tải...</TableCell></TableRow>
              ) : sortedProducts.length === 0 ? (
                <TableRow><TableCell colSpan={isOwner ? 7 : 6} className="text-center py-8">Chưa có sản phẩm nào</TableCell></TableRow>
              ) : (
                sortedProducts.map((prod) => (
                  <TableRow key={prod.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.name} className="w-10 h-10 rounded-lg object-cover border border-[#e5e7eb]" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-[#71717a]">No img</div>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-[#022c22]">{prod.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-[#f5f5f5] text-[#007a55] border-0 font-bold">
                        {prod.category.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{prod.basePrice.toLocaleString('vi-VN')} đ</TableCell>
                    <TableCell className="font-bold">{(prod.soldQuantity ?? 0).toLocaleString('vi-VN')}</TableCell>
                    <TableCell>
                      <Badge variant={prod.status === 'ACTIVE' ? 'default' : prod.status === 'SOLD_OUT' ? 'destructive' : 'secondary'} className="font-bold">
                        {prod.status === 'ACTIVE' ? 'Đang bán' : prod.status === 'SOLD_OUT' ? 'Hết hàng' : 'Ngừng bán'}
                      </Badge>
                    </TableCell>
                    {isOwner && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100" onClick={() => openEdit(prod)}>
                            <EditIcon className="h-4 w-4 text-slate-700" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-red-50" onClick={() => {
                            if (confirm("Bạn có chắc muốn xóa sản phẩm này?")) deleteMutation.mutate(prod.id)
                          }}>
                            <TrashIcon className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card List View (< md) */}
        <div className="md:hidden space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-xs text-[#71717a]">Đang tải...</div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#71717a]">Chưa có sản phẩm nào</div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {sortedProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                >
                  {prod.imageUrl ? (
                    <img src={prod.imageUrl} alt={prod.name} className="h-10 w-10 shrink-0 rounded-md object-cover border border-[#e5e7eb]" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[8px] text-[#71717a] border border-[#e5e7eb]">No img</div>
                  )}
                  <div className="min-w-0 flex-1 flex flex-col justify-between h-10">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          prod.status === 'ACTIVE' ? "bg-emerald-500" : prod.status === 'SOLD_OUT' ? "bg-rose-500" : "bg-slate-400"
                        }`} />
                        <h4 className="truncate text-[10px] font-black text-[#022c22]">{prod.name}</h4>
                        <span className="flex items-center justify-center h-3.5 min-w-[14px] rounded-full bg-[#d2f2e7] text-[8px] font-black text-[#007a55] border border-[#00bc7d]/15 px-0.5 shrink-0">
                          {prod.soldQuantity ?? 0}
                        </span>
                      </div>
                      <Badge variant="secondary" className="px-1 py-0 text-[8px] font-bold text-[#007a55] whitespace-nowrap bg-[#f5f5f5] border-0 shrink-0">
                        {prod.category.name}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] font-black text-[#007a55]">{prod.basePrice.toLocaleString('vi-VN')} đ</span>

                      {isOwner && (
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full hover:bg-slate-100" onClick={() => openEdit(prod)}>
                            <EditIcon className="h-3 w-3 text-slate-700" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full hover:bg-red-50" onClick={() => {
                            if (confirm("Bạn có chắc muốn xóa sản phẩm này?")) deleteMutation.mutate(prod.id)
                          }}>
                            <TrashIcon className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-3 md:p-6 w-[95vw] sm:w-full rounded-xl md:rounded-2xl border-[#e5e7eb] bg-white text-[#022c22] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <DialogHeader className="p-0.5">
            <DialogTitle className="text-base md:text-lg font-black tracking-[-0.03em] text-[#022c22]">
              {editingItem ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs">
              <div className="col-span-4 space-y-1">
                <Label className="text-[11px] font-bold text-[#022c22]">Tên món</Label>
                <Input required value={name} onChange={e => setName(e.target.value)} className="h-8 text-[11px] rounded-lg border-[#e5e7eb] focus-visible:ring-[#10b981]" />
              </div>

              <div className="col-span-4 space-y-1">
                <Label className="text-[11px] font-bold text-[#022c22]">Danh mục</Label>
                <Select value={String(categoryId)} onValueChange={v => setCategoryId(Number(v))}>
                  <SelectTrigger className="h-8 text-[11px] rounded-lg border-[#e5e7eb] focus-visible:ring-[#10b981] py-1 px-1.5">
                    <SelectValue placeholder="Danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-4 space-y-1">
                <Label className="text-[11px] font-bold text-[#022c22]">Trạng thái</Label>
                <Select value={status} onValueChange={v => setStatus(v as ProductStatus)}>
                  <SelectTrigger className="h-8 text-[11px] rounded-lg border-[#e5e7eb] focus-visible:ring-[#10b981] py-1 px-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE" className="text-xs">Đang bán</SelectItem>
                    <SelectItem value="SOLD_OUT" className="text-xs">Hết hàng</SelectItem>
                    <SelectItem value="INACTIVE" className="text-xs">Ngừng bán</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-4 space-y-1">
                <Label className="text-[11px] font-bold text-[#022c22]">Giá gốc (VNĐ)</Label>
                <Input type="number" required value={basePrice} onChange={e => {
                  const val = Number(e.target.value)
                  setBasePrice(val)
                  if (!editingItem) {
                    setVariants(variants.map(v => ({ ...v, price: val }))) // Auto sync base price to variants for new product
                  }
                }} className="h-8 text-xs rounded-lg border-[#e5e7eb] focus-visible:ring-[#10b981]" />
              </div>

              <div className="col-span-8 space-y-1">
                <Label className="text-[11px] font-bold text-[#022c22]">Mô tả ngắn</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} className="h-8 text-xs rounded-lg border-[#e5e7eb] focus-visible:ring-[#10b981]" />
              </div>
            </div>

            <div className="flex gap-3 items-start border-t pt-3 border-[#e5e7eb]">
              {/* Left Side: Image upload */}
              <div className="w-32 md:w-36 shrink-0 space-y-1">
                <Label className="text-[11px] font-bold text-[#022c22]">Hình ảnh</Label>
                <div className="border border-dashed rounded-lg p-1.5 text-center border-[#e5e7eb] bg-[#f5f5f5]/30">
                  {imageUrl ? (
                    <div className="relative">
                      <img src={imageUrl} alt="preview" className="mx-auto w-full h-16 object-contain rounded" />
                      <Button type="button" variant="secondary" size="sm" className="mt-1 h-5 px-1.5 text-[9px] rounded-full" onClick={() => setImageUrl('')}>Xóa</Button>
                    </div>
                  ) : (
                    <div className="py-2 flex flex-col items-center justify-center">
                      <UploadIcon className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
                      <Label className="cursor-pointer bg-[#00bc7d] text-white text-[9px] font-bold px-2 py-0.5 rounded-full hover:bg-[#007a55]">
                        Tải ảnh
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </Label>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Variants Configuration */}
              <div className="flex-1 min-w-0 space-y-1">
                <Label className="text-[11px] font-bold text-[#022c22]">Giá theo kích cỡ (Variants)</Label>
                {sizes.length === 0 ? (
                  <p className="text-[9px] text-muted-foreground">Chưa có cấu hình kích cỡ.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {sizes.map(size => {
                      const variant = variants.find(v => v.sizeId === size.id)
                      const isEnabled = enabledSizeIds.includes(size.id)
                      return (
                        <div key={size.id} className="flex items-center space-x-1 bg-slate-50 border border-[#e5e7eb] p-1 rounded-md">
                          <Checkbox 
                             checked={isEnabled} 
                             onCheckedChange={(checked: boolean | 'indeterminate') => {
                               if (checked === true) {
                                 setEnabledSizeIds(prev => [...prev, size.id])
                               } else if (checked === false) {
                                 setEnabledSizeIds(prev => prev.filter(id => id !== size.id))
                               }
                             }}
                             id={`size-${size.id}`}
                             className="h-3.5 w-3.5 rounded border-[#e5e7eb] text-[#007a55]"
                          />
                          <Label htmlFor={`size-${size.id}`} className={`w-8 truncate cursor-pointer text-[10px] font-bold ${!isEnabled ? 'text-muted-foreground' : 'text-[#022c22]'}`}>{size.name}</Label>
                          <Input 
                            type="number" 
                            disabled={!isEnabled}
                            value={variant?.price || 0} 
                            onChange={e => handleVariantPriceChange(size.id, Number(e.target.value))}
                            className="h-5 text-[10px] flex-1 px-1 rounded border-[#e5e7eb] focus-visible:ring-[#10b981]"
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-[#e5e7eb]">
              <Button type="button" variant="outline" size="sm" className="h-7 rounded-full text-xs" onClick={() => setIsOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" size="sm" className="h-7 rounded-full text-xs bg-[#00bc7d] text-white hover:bg-[#007a55]" disabled={createMutation.isPending || updateMutation.isPending}>
                Lưu lại
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
