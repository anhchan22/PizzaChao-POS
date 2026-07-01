import { useState } from "react"
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
import { PlusIcon, EditIcon, TrashIcon, UploadIcon, Pizza } from "lucide-react"

export default function ProductManagementPage() {
  const queryClient = useQueryClient()
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

  const { data: products = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: productApi.getAll })
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: categoryApi.getAll })
  const { data: sizes = [] } = useQuery({ queryKey: ["sizes"], queryFn: sizeApi.getAll })

  const createMutation = useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Tạo món thành công")
      setIsOpen(false)
    },
    onError: () => toast.error("Có lỗi xảy ra")
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: ProductRequest }) => productApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Cập nhật món thành công")
      setIsOpen(false)
    },
    onError: () => toast.error("Có lỗi xảy ra")
  })

  const deleteMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
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
      <div className="space-y-6 rounded-2xl border border-[#e5e7eb] bg-white/90 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-black leading-none tracking-[-0.04em] text-[#022c22] sm:text-3xl">
          <Pizza className="h-7 w-7 text-[#007a55]" />
          Sản phẩm / Món ăn
        </h1>
        <Button onClick={openNew}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Thêm Món Mới
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ảnh</TableHead>
              <TableHead>Tên món</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Giá gốc</TableHead>
              <TableHead>Đã bán</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center">Đang tải...</TableCell></TableRow>
            ) : products.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center">Chưa có sản phẩm nào</TableCell></TableRow>
            ) : (
              products.map((prod) => (
                <TableRow key={prod.id}>
                  <TableCell>
                    {prod.imageUrl ? (
                      <img src={prod.imageUrl} alt={prod.name} className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">No img</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{prod.name}</TableCell>
                  <TableCell>{prod.category.name}</TableCell>
                  <TableCell>{prod.basePrice.toLocaleString('vi-VN')} đ</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-semibold">
                      {(prod.soldQuantity ?? 0).toLocaleString('vi-VN')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={prod.status === 'ACTIVE' ? 'default' : prod.status === 'SOLD_OUT' ? 'destructive' : 'secondary'}>
                      {prod.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(prod)}>
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm("Bạn có chắc muốn xóa?")) deleteMutation.mutate(prod.id)
                    }}>
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tên món</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Danh mục</Label>
                  <Select value={String(categoryId)} onValueChange={v => setCategoryId(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Giá mặc định (VNĐ)</Label>
                  <Input type="number" required value={basePrice} onChange={e => {
                    const val = Number(e.target.value)
                    setBasePrice(val)
                    if (!editingItem) {
                      setVariants(variants.map(v => ({ ...v, price: val }))) // Auto sync base price to variants for new product
                    }
                  }} />
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select value={status} onValueChange={v => setStatus(v as ProductStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Đang bán</SelectItem>
                      <SelectItem value="SOLD_OUT">Hết hàng</SelectItem>
                      <SelectItem value="INACTIVE">Ngừng bán</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Hình ảnh</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {imageUrl ? (
                      <div className="relative">
                        <img src={imageUrl} alt="preview" className="w-full h-32 object-contain" />
                        <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => setImageUrl('')}>Xóa ảnh</Button>
                      </div>
                    ) : (
                      <>
                        <UploadIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <Input type="file" accept="image/*" onChange={handleImageUpload} className="max-w-[200px] mx-auto" />
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mô tả ngắn</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label className="text-lg font-semibold">Cấu hình giá theo kích cỡ (Variants)</Label>
              {sizes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có cấu hình kích cỡ nào trong hệ thống.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {sizes.map(size => {
                    const variant = variants.find(v => v.sizeId === size.id)
                    const isEnabled = enabledSizeIds.includes(size.id)
                    return (
                      <div key={size.id} className="flex items-center space-x-2 bg-muted/20 p-2 rounded-md">
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
                        />
                        <Label htmlFor={`size-${size.id}`} className={`w-20 cursor-pointer ${!isEnabled && 'text-muted-foreground'}`}>{size.name}</Label>
                        <Input 
                          type="number" 
                          disabled={!isEnabled}
                          value={variant?.price || 0} 
                          onChange={e => handleVariantPriceChange(size.id, Number(e.target.value))}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Lưu lại
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
