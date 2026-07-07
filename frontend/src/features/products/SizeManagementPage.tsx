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
import { useAuthStore } from "@/stores/authStore"

export default function SizeManagementPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const isOwner = user?.role === 'OWNER'
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
      queryClient.invalidateQueries({ queryKey: ["pos-products"] })
      toast.success("Tạo kích cỡ thành công")
      setIsOpen(false)
    },
    onError: () => toast.error("Có lỗi xảy ra")
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: SizeRequest }) => sizeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] })
      queryClient.invalidateQueries({ queryKey: ["pos-products"] })
      toast.success("Cập nhật thành công")
      setIsOpen(false)
    },
    onError: () => toast.error("Có lỗi xảy ra")
  })

  const deleteMutation = useMutation({
    mutationFn: sizeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] })
      queryClient.invalidateQueries({ queryKey: ["pos-products"] })
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
    <div className="min-h-[calc(100vh-1.5rem)] rounded-2xl bg-[#d2f2e7] p-1.5 text-[#022c22] sm:p-4">
      <div className="space-y-1.5 sm:space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-1.5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-2">
          <h1 className="flex items-center gap-1 text-xs font-black leading-none tracking-[-0.04em] text-[#022c22] sm:text-3xl">
            <Ruler className="h-4 w-4 sm:h-7 sm:w-7 text-[#007a55]" />
            Quản lý kích cỡ
          </h1>
          {isOwner && (
            <Button
              size="sm"
              className="h-5 px-2 rounded text-[9px] bg-[#00bc7d] text-white hover:bg-[#007a55] sm:h-9 sm:px-4 sm:rounded-full sm:text-sm"
              onClick={() => {
                setEditingItem(null)
                setFormData({ name: "", description: "" })
                setIsOpen(true)
              }}
            >
              <PlusIcon className="mr-0.5 h-2.5 w-2.5 sm:mr-1 sm:h-3.5 sm:w-3.5" />
              Thêm kích cỡ
            </Button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#e5e7eb]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-[#022c22] border-b border-[#022c22]">
                <TableHead className="w-8 px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[9px] sm:text-xs">STT</TableHead>
                <TableHead className="px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[9px] sm:text-xs">Tên</TableHead>
                <TableHead className="px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[9px] sm:text-xs">Mô tả</TableHead>
                {isOwner && <TableHead className="w-16 px-1 py-1 sm:px-3 sm:py-2 text-right font-bold text-white text-[9px] sm:text-xs">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={isOwner ? 4 : 3} className="text-center py-2 text-[9px] sm:text-sm">Đang tải...</TableCell></TableRow>
              ) : sizes.length === 0 ? (
                <TableRow><TableCell colSpan={isOwner ? 4 : 3} className="text-center py-2 text-[9px] sm:text-sm">Chưa có kích cỡ nào</TableCell></TableRow>
              ) : (
                sizes.map((sz, idx) => (
                  <TableRow key={sz.id}>
                    <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-[9px] sm:text-sm text-[#71717a]">{idx + 1}</TableCell>
                    <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-[9px] sm:text-sm font-bold text-[#022c22]">{sz.name}</TableCell>
                    <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-[9px] sm:text-sm text-[#71717a]">{sz.description}</TableCell>
                    {isOwner && (
                      <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" className="h-4 w-4 sm:h-7 sm:w-7" onClick={() => openEdit(sz)}>
                          <EditIcon className="h-3 w-3 sm:h-4 sm:w-4 text-[#022c22]" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-4 w-4 sm:h-7 sm:w-7" onClick={() => {
                          if (confirm("Bạn có chắc muốn xóa?")) deleteMutation.mutate(sz.id)
                        }}>
                          <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
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
