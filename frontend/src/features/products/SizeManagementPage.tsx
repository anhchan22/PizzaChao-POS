import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sizeApi } from "@/apis/product.api"
import type { Size, SizeRequest } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { PlusIcon, EditIcon, TrashIcon, Ruler } from "lucide-react"

export default function SizeManagementPage() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Size | null>(null)
  const [formData, setFormData] = useState<SizeRequest>({ name: "", description: "" })

  const { data: sizes = [], isLoading } = useQuery({
    queryKey: ["sizes"],
    queryFn: sizeApi.getAll
  })

  const createMutation = useMutation({
    mutationFn: sizeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] })
      toast.success("Tạo kích cỡ thành công")
      setIsOpen(false)
    },
    onError: () => toast.error("Có lỗi xảy ra")
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: SizeRequest }) => sizeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] })
      toast.success("Cập nhật thành công")
      setIsOpen(false)
    },
    onError: () => toast.error("Có lỗi xảy ra")
  })

  const deleteMutation = useMutation({
    mutationFn: sizeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] })
      toast.success("Xóa kích cỡ thành công")
    },
    onError: () => toast.error("Không thể xóa kích cỡ này")
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const openEdit = (size: Size) => {
    setEditingItem(size)
    setFormData({
      name: size.name,
      description: size.description || ""
    })
    setIsOpen(true)
  }

  return (
    <div className="min-h-[calc(100vh-1.5rem)] rounded-2xl bg-[#d2f2e7] p-3 text-[#022c22] sm:p-4">
      <div className="space-y-6 rounded-2xl border border-[#e5e7eb] bg-white/90 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-black leading-none tracking-[-0.04em] text-[#022c22] sm:text-3xl">
          <Ruler className="h-7 w-7 text-[#007a55]" />
          Quản lý kích cỡ
        </h1>
        <Button onClick={() => {
          setEditingItem(null)
          setFormData({ name: "", description: "" })
          setIsOpen(true)
        }}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Thêm kích cỡ
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>STT</TableHead>
              <TableHead>Tên (S, M, L, Nhỏ, Lớn...)</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center">Đang tải...</TableCell></TableRow>
            ) : sizes.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center">Chưa có kích cỡ nào</TableCell></TableRow>
            ) : (
              sizes.map((sz, idx) => (
                <TableRow key={sz.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="font-medium">{sz.name}</TableCell>
                  <TableCell>{sz.description}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(sz)}>
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm("Bạn có chắc muốn xóa?")) deleteMutation.mutate(sz.id)
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
            <DialogTitle>{editingItem ? "Sửa kích cỡ" : "Thêm kích cỡ"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tên kích cỡ</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Nhỏ, Vừa, Lớn" />
            </div>
            <div className="space-y-2">
              <Label>Mô tả thêm</Label>
              <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
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
