import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarClock, Clock3, Edit3, Loader2, ReceiptText, UserRound } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { attendanceApi } from './api/attendance.api'
import { useAuthStore } from '@/stores/authStore'
import type { AttendanceShift, AttendanceStatus } from './types/attendance.types'
import {
  formatDate,
  formatDateTime,
  formatWorkedMinutes,
  getDefaultDateRange,
  isRangeLongerThanOneMonth,
} from './utils/attendance-format'

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback
  }
  return fallback
}

export default function AttendanceDetailPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const isOwner = user?.role === 'OWNER'
  const defaultRange = useMemo(() => getDefaultDateRange(), [])
  const [fromDate, setFromDate] = useState(searchParams.get('fromDate') ?? defaultRange.fromDate)
  const [toDate, setToDate] = useState(searchParams.get('toDate') ?? defaultRange.toDate)
  const [status, setStatus] = useState<AttendanceStatus>((searchParams.get('status') as AttendanceStatus) || 'CLOSED')
  const [editingShift, setEditingShift] = useState<AttendanceShift | null>(null)
  const [attendanceNote, setAttendanceNote] = useState('')

  const numericUserId = Number(userId)
  const rangeInvalid = isRangeLongerThanOneMonth(fromDate, toDate)

  const detailQuery = useQuery({
    queryKey: ['attendance-detail', numericUserId, fromDate, toDate, status],
    queryFn: () => attendanceApi.getEmployeeDetail(numericUserId, { fromDate, toDate, status }),
    enabled: Number.isFinite(numericUserId) && numericUserId > 0 && !rangeInvalid,
  })

  const updateNoteMutation = useMutation({
    mutationFn: ({ shiftId, note }: { shiftId: number; note: string }) =>
      attendanceApi.updateNote(shiftId, { attendanceNote: note.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-detail', numericUserId] })
      setEditingShift(null)
      setAttendanceNote('')
      toast.success('Đã cập nhật ghi chú chấm công')
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Không thể cập nhật ghi chú')),
  })

  const detail = detailQuery.data?.data
  const shifts = detail?.shifts ?? []

  const applyFilterToUrl = () => {
    setSearchParams({ fromDate, toDate, status })
  }

  const openNoteDialog = (shift: AttendanceShift) => {
    setEditingShift(shift)
    setAttendanceNote(shift.attendanceNote ?? '')
  }

  return (
    <div className="min-h-[calc(100vh-1.5rem)] rounded-2xl bg-[#d2f2e7] p-1.5 text-[#022c22] sm:p-4">
      <div className="space-y-1.5 sm:space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-1.5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-3">
            {isOwner ? (
                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[9px] sm:h-9 sm:px-4 sm:text-sm" onClick={() => navigate('/admin/attendance')}>
                <ArrowLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                Quay lại
              </Button>
            ) : (
                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[9px] sm:h-9 sm:px-4 sm:text-sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                Quay về
              </Button>
            )}
            <h1 className="flex items-center gap-1 text-xs font-black leading-none tracking-[-0.04em] text-[#022c22] sm:text-3xl">
              <UserRound className="h-4 w-4 sm:h-7 sm:w-7 text-[#007a55]" />
              {detail?.user.fullName ?? 'Chi tiết chấm công'}
            </h1>
          </div>
        </div>

        <Card className="border-[#e5e7eb] bg-white shadow-sm rounded-lg">
          <CardHeader className="p-1.5 pb-0.5 sm:p-4 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-lg font-black tracking-[-0.03em] text-[#022c22]">Bộ lọc</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 sm:space-y-3 px-1.5 py-1 sm:p-4">
            <div className="grid gap-1.5 sm:gap-3 grid-cols-[1fr_1fr_1fr_auto]">
              <div className="space-y-0.5">
                <Label htmlFor="attendanceDetailFromDate" className="text-[8px] sm:text-xs">Từ ngày</Label>
                <Input
                  id="attendanceDetailFromDate"
                  type="date"
                  className="h-7 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="attendanceDetailToDate" className="text-[8px] sm:text-xs">Đến ngày</Label>
                <Input
                  id="attendanceDetailToDate"
                  type="date"
                  className="h-7 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-[8px] sm:text-xs">Trạng thái ca</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as AttendanceStatus)}>
                  <SelectTrigger className="h-7 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLOSED" className="text-xs sm:text-sm">Đã đóng</SelectItem>
                    <SelectItem value="OPEN" className="text-xs sm:text-sm">Đang mở</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full h-7 sm:h-9 text-xs sm:text-sm px-2 sm:px-3" onClick={applyFilterToUrl}>Lọc</Button>
              </div>
            </div>
            {rangeInvalid && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-[9px] sm:text-sm text-destructive">
                Khoảng thời gian xem chấm công tối đa là 1 tháng.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-0.5 sm:gap-3 grid-cols-4">
          <MetricCard
            title="Tổng giờ làm"
            value={formatWorkedMinutes(detail?.summary.totalWorkedMinutes ?? 0)}
            icon={<Clock3 className="h-2.5 w-2.5 sm:h-5 sm:w-5" />}
          />
          <MetricCard
            title="Tổng số ca"
            value={String(detail?.summary.totalShifts ?? 0)}
            icon={<CalendarClock className="h-2.5 w-2.5 sm:h-5 sm:w-5" />}
          />
          <MetricCard
            title="Trung bình/ca"
            value={formatWorkedMinutes(Math.round((detail?.summary.averageHoursPerShift ?? 0) * 60))}
            icon={<Clock3 className="h-2.5 w-2.5 sm:h-5 sm:w-5" />}
          />
          <MetricCard
            title="SĐT nhân viên"
            value={detail?.user.phone ?? '—'}
            icon={<UserRound className="h-2.5 w-2.5 sm:h-5 sm:w-5" />}
          />
        </div>

        <Card className="border-[#e5e7eb] bg-white shadow-sm rounded-lg">
          <CardHeader className="p-1.5 sm:p-4 pb-0.5 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-lg font-black tracking-[-0.03em] text-[#022c22]">Danh sách ca làm</CardTitle>
          </CardHeader>
          <CardContent className="p-1.5 pt-0 sm:p-4 sm:pt-0">
            {detailQuery.isLoading ? (
              <div className="flex min-h-24 items-center justify-center gap-1 text-[#71717a] text-[9px] sm:text-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang tải chi tiết chấm công...
              </div>
            ) : detailQuery.isError ? (
              <div className="flex min-h-24 flex-col items-center justify-center gap-1.5">
                <p className="text-destructive text-[9px] sm:text-sm">Không thể tải chi tiết chấm công.</p>
                <Button variant="outline" size="sm" className="h-6 sm:h-9 text-[9px] sm:text-sm" onClick={() => detailQuery.refetch()}>Thử lại</Button>
              </div>
            ) : shifts.length === 0 ? (
              <div className="flex min-h-24 items-center justify-center text-[#71717a] text-[9px] sm:text-sm">
                Nhân viên chưa có ca làm phù hợp với bộ lọc.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#e5e7eb]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-[#022c22] border-b border-[#022c22]">
                      <TableHead className="px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[9px] sm:text-xs">Ngày</TableHead>
                      <TableHead className="px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[9px] sm:text-xs">Mở ca</TableHead>
                      <TableHead className="px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[9px] sm:text-xs">Đóng ca</TableHead>
                      <TableHead className="w-16 px-1 py-1 sm:px-3 sm:py-2 text-right font-bold text-white text-[9px] sm:text-xs">Giờ làm</TableHead>
                      <TableHead className="w-20 px-1 py-1 sm:px-3 sm:py-2 text-right font-bold text-white text-[9px] sm:text-xs">Doanh thu</TableHead>
                      <TableHead className="w-16 px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[9px] sm:text-xs">Trạng thái</TableHead>
                      <TableHead className="px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[9px] sm:text-xs">Ghi chú</TableHead>
                      {isOwner && <TableHead className="w-16 px-1 py-1 sm:px-3 sm:py-2 text-right font-bold text-white text-[9px] sm:text-xs">Sửa</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts.map((shift) => (
                      <TableRow key={shift.shiftId}>
                        <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 font-bold text-[#022c22] text-[9px] sm:text-sm">{formatDate(shift.workDate)}</TableCell>
                        <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-[9px] sm:text-sm text-[#71717a]">{formatDateTime(shift.openedAt)}</TableCell>
                        <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-[9px] sm:text-sm text-[#71717a]">{formatDateTime(shift.closedAt)}</TableCell>
                        <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-right font-bold text-[#007a55] text-[9px] sm:text-sm">
                          {formatWorkedMinutes(shift.workedMinutes)}
                        </TableCell>
                        <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-right text-[9px] sm:text-sm text-[#71717a]">
                          <span className="inline-flex items-center gap-0.5">
                            <ReceiptText className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-muted-foreground" />
                            {currency.format(shift.totalRevenue ?? 0)}
                          </span>
                        </TableCell>
                        <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2">
                          <Badge variant={shift.status === 'CLOSED' ? 'secondary' : 'default'} className="px-1 py-0 sm:px-2 sm:py-0.5 text-[8px] sm:text-xs scale-[0.8] sm:scale-100 origin-left whitespace-nowrap">
                            {shift.status === 'CLOSED' ? 'Đã đóng' : 'Đang mở'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2">
                          <div className="max-w-[200px] space-y-0.5 text-[9px] sm:text-sm text-[#71717a]">
                            {shift.attendanceNote && <p className="font-bold text-[#022c22]">{shift.attendanceNote}</p>}
                            {shift.closingNote && <p className="text-[#71717a]">Đóng ca: {shift.closingNote}</p>}
                            {!shift.attendanceNote && !shift.closingNote && <span className="text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                        {isOwner && (
                          <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-right whitespace-nowrap">
                            <Button variant="ghost" size="sm" className="h-5 sm:h-8 px-1.5 sm:px-3 text-[9px] sm:text-sm" onClick={() => openNoteDialog(shift)}>
                              <Edit3 className="mr-0.5 h-2.5 w-2.5 sm:h-4 sm:w-4" />
                              Ghi chú
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editingShift !== null} onOpenChange={(open) => !open && setEditingShift(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Ghi chú chấm công ca #{editingShift?.shiftId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p>Ngày: {formatDate(editingShift?.workDate)}</p>
              <p className="text-muted-foreground">
                {formatDateTime(editingShift?.openedAt)} → {formatDateTime(editingShift?.closedAt)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendanceNote">Ghi chú của chủ cửa hàng</Label>
              <Textarea
                id="attendanceNote"
                maxLength={500}
                value={attendanceNote}
                onChange={(event) => setAttendanceNote(event.target.value)}
                placeholder="VD: đi muộn, hỗ trợ tăng ca, đổi ca..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">{attendanceNote.length}/500 ký tự</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingShift(null)}>Hủy</Button>
            <Button
              disabled={updateNoteMutation.isPending || !editingShift}
              onClick={() => {
                if (editingShift) {
                  updateNoteMutation.mutate({ shiftId: editingShift.shiftId, note: attendanceNote })
                }
              }}
            >
              {updateNoteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu ghi chú
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string
  icon: ReactNode
}) {
  return (
    <Card className="border-[#e5e7eb] bg-white shadow-sm rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-1 sm:p-4 pb-0.5 sm:pb-2">
        <CardTitle className="text-[7px] sm:text-xs font-medium text-muted-foreground truncate mr-0.5">{title}</CardTitle>
        <div className="text-[#007a55] shrink-0">{icon}</div>
      </CardHeader>
      <CardContent className="p-1 sm:p-4 pt-0 sm:pt-0">
        <p className="text-[9px] sm:text-lg font-black text-[#022c22] truncate leading-tight">{value}</p>
      </CardContent>
    </Card>
  )
}
