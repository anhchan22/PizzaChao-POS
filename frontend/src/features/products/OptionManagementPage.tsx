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
import { PlusIcon, EditIcon, TrashIcon } from "lucide-react"

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
      toast.success("Tạo topping thành công")
      setIsOpen(false)
    },
    onError: () => toast.error("Có lỗi xảy ra")
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: OptionRequest }) => optionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] })
      toast.success("Cập nhật thành công")
      setIsOpen(false)
    },
    onError: () => toast.error("Có lỗi xảy ra")
  })

  const deleteMutation = useMutation({
    mutationFn: optionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["options"] })
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý Topping</h1>
        <Button onClick={() => {
          setEditingItem(null)
          setFormData({ name: "", price: 0, isActive: true })
          setIsOpen(true)
        }}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Thêm Topping
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>STT</TableHead>
              <TableHead>Tên topping</TableHead>
              <TableHead>Giá (VNĐ)</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Đang tải...</TableCell></TableRow>
            ) : optionList.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center">Chưa có topping nào</TableCell></TableRow>
            ) : (
              optionList.map((opt, idx) => (
                <TableRow key={opt.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="font-medium">{opt.name}</TableCell>
                  <TableCell>{opt.price.toLocaleString('vi-VN')} đ</TableCell>
                  <TableCell>
                    <Switch 
                      checked={opt.isActive} 
                      onCheckedChange={(checked) => updateMutation.mutate({ id: opt.id, data: { ...opt, isActive: checked }})}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(opt)}>
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm("Bạn có chắc muốn xóa?")) deleteMutation.mutate(opt.id)
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
  )
}
