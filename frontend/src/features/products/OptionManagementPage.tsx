import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { optionApi } from "@/apis/product.api"
import type { ProductOption, OptionRequest } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { PlusIcon, EditIcon, TrashIcon, Layers } from "lucide-react"

export default function OptionManagementPage() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProductOption | null>(null)
  const [formData, setFormData] = useState<OptionRequest>({ name: "", price: 0, isActive: true })

  const { data: options = [], isLoading } = useQuery({
    queryKey: ["options"],
    queryFn: optionApi.getAll
  })
  const optionList = Array.isArray(options) ? options : []

  const createMutation = useMutation({
    mutationFn: optionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] })
      queryClient.invalidateQueries({ queryKey: ["pos-options"] })
      toast.success("Tạo topping thành công")
      setIsOpen(false)
    },
    onError: () => toast.error("Có lỗi xảy ra")
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: OptionRequest }) => optionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] })
      queryClient.invalidateQueries({ queryKey: ["pos-options"] })
      toast.success("Cập nhật thành công")
      setIsOpen(false)
    },
    onError: () => toast.error("Có lỗi xảy ra")
  })

  const deleteMutation = useMutation({
    mutationFn: optionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] })
      queryClient.invalidateQueries({ queryKey: ["pos-options"] })
      toast.success("Xóa topping thành công")
    },
    onError: () => toast.error("Không thể xóa topping này")
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const openEdit = (opt: ProductOption) => {
    setEditingItem(opt)
    setFormData({
      name: opt.name,
      price: opt.price,
      isActive: opt.isActive
    })
    setIsOpen(true)
  }

  return (
    <div className="min-h-[calc(100vh-1.5rem)] rounded-2xl bg-[#d2f2e7] p-1.5 text-[#022c22] sm:p-4">
      <div className="space-y-1.5 sm:space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-1.5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-2">
          <h1 className="flex items-center gap-1 text-xs font-black leading-none tracking-[-0.04em] text-[#022c22] sm:text-3xl">
            <Layers className="h-4 w-4 sm:h-7 sm:w-7 text-[#007a55]" />
            Topping
          </h1>
          <Button
            size="sm"
            className="h-5 px-2 rounded text-[9px] bg-[#00bc7d] text-white hover:bg-[#007a55] sm:h-9 sm:px-4 sm:rounded-full sm:text-sm"
            onClick={() => {
              setEditingItem(null)
              setFormData({ name: "", price: 0, isActive: true })
              setIsOpen(true)
            }}
          >
            <PlusIcon className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3.5 sm:w-3.5" />
            Thêm Topping
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#e5e7eb]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-[#022c22] border-b border-[#022c22]">
                <TableHead className="w-8 px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[9px] sm:text-xs">STT</TableHead>
                <TableHead className="px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[9px] sm:text-xs">Tên topping</TableHead>
                <TableHead className="px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[9px] sm:text-xs">Giá (VNĐ)</TableHead>
                <TableHead className="w-16 px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[9px] sm:text-xs">Trạng thái</TableHead>
                <TableHead className="w-16 px-1 py-1 sm:px-3 sm:py-2 text-right font-bold text-white text-[9px] sm:text-xs">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-2 text-[9px] sm:text-sm">Đang tải...</TableCell></TableRow>
              ) : optionList.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-2 text-[9px] sm:text-sm">Chưa có topping nào</TableCell></TableRow>
              ) : (
                optionList.map((opt, idx) => (
                  <TableRow key={opt.id}>
                    <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-[9px] sm:text-sm text-[#71717a]">{idx + 1}</TableCell>
                    <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-[9px] sm:text-sm font-bold text-[#022c22]">{opt.name}</TableCell>
                    <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-[9px] sm:text-sm text-[#007a55] font-bold">{opt.price.toLocaleString('vi-VN')} đ</TableCell>
                    <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-[9px] sm:text-sm">
                      <Switch
                        checked={opt.isActive}
                        onCheckedChange={(checked) => updateMutation.mutate({ id: opt.id, data: { ...opt, isActive: checked }})}
                        className="scale-[0.65] sm:scale-100 origin-left"
                      />
                    </TableCell>
                    <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" className="h-4 w-4 sm:h-7 sm:w-7" onClick={() => openEdit(opt)}>
                        <EditIcon className="h-3 w-3 sm:h-4 sm:w-4 text-[#022c22]" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-4 w-4 sm:h-7 sm:w-7" onClick={() => {
                        if (confirm("Bạn có chắc muốn xóa?")) deleteMutation.mutate(opt.id)
                      }}>
                        <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Sửa topping" : "Thêm topping"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tên topping</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Quẩy, Trứng, Phô mai" />
              </div>
              <div className="space-y-2">
                <Label>Giá bán (VNĐ)</Label>
                <Input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
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
