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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" className="mb-2 px-0" onClick={() => navigate('/admin/attendance')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại bảng chấm công
          </Button>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <UserRound className="h-7 w-7 text-primary" />
            {detail?.user.fullName ?? 'Chi tiết chấm công'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Xem từng ca làm, doanh thu theo ca và ghi chú chấm công của nhân viên.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="attendanceDetailFromDate">Từ ngày</Label>
              <Input
                id="attendanceDetailFromDate"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendanceDetailToDate">Đến ngày</Label>
              <Input
                id="attendanceDetailToDate"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái ca</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as AttendanceStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLOSED">Đã đóng</SelectItem>
                  <SelectItem value="OPEN">Đang mở</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={applyFilterToUrl}>Áp dụng</Button>
            </div>
          </div>
          {rangeInvalid && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Khoảng thời gian xem chấm công tối đa là 1 tháng.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Tổng giờ làm"
          value={formatWorkedMinutes(detail?.summary.totalWorkedMinutes ?? 0)}
          icon={<Clock3 className="h-5 w-5" />}
        />
        <MetricCard
          title="Tổng số ca"
          value={String(detail?.summary.totalShifts ?? 0)}
          icon={<CalendarClock className="h-5 w-5" />}
        />
        <MetricCard
          title="Trung bình / ca"
          value={formatWorkedMinutes(Math.round((detail?.summary.averageHoursPerShift ?? 0) * 60))}
          icon={<Clock3 className="h-5 w-5" />}
        />
        <MetricCard
          title="Số điện thoại"
          value={detail?.user.phone ?? '—'}
          icon={<UserRound className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách ca làm</CardTitle>
        </CardHeader>
        <CardContent>
          {detailQuery.isLoading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang tải chi tiết chấm công...
            </div>
          ) : detailQuery.isError ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3">
              <p className="text-destructive">Không thể tải chi tiết chấm công.</p>
              <Button variant="outline" onClick={() => detailQuery.refetch()}>Thử lại</Button>
            </div>
          ) : shifts.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center text-muted-foreground">
              Nhân viên chưa có ca làm phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Mở ca</TableHead>
                    <TableHead>Đóng ca</TableHead>
                    <TableHead className="text-right">Giờ làm</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="text-right">Sửa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift) => (
                    <TableRow key={shift.shiftId}>
                      <TableCell>{formatDate(shift.workDate)}</TableCell>
                      <TableCell>{formatDateTime(shift.openedAt)}</TableCell>
                      <TableCell>{formatDateTime(shift.closedAt)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatWorkedMinutes(shift.workedMinutes)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-1">
                          <ReceiptText className="h-3.5 w-3.5 text-muted-foreground" />
                          {currency.format(shift.totalRevenue ?? 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={shift.status === 'CLOSED' ? 'secondary' : 'default'}>
                          {shift.status === 'CLOSED' ? 'Đã đóng' : 'Đang mở'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[260px] space-y-1 text-sm">
                          {shift.attendanceNote && <p className="font-medium">{shift.attendanceNote}</p>}
                          {shift.closingNote && <p className="text-muted-foreground">Đóng ca: {shift.closingNote}</p>}
                          {!shift.attendanceNote && !shift.closingNote && <span className="text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openNoteDialog(shift)}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Ghi chú
                        </Button>
                      </TableCell>
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-black">{value}</p>
      </CardContent>
    </Card>
  )
}
