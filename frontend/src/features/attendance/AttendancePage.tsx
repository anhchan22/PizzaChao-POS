import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarClock, Clock3, Loader2, Trophy, Users } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { attendanceApi } from './api/attendance.api'
import type { AttendanceStatus } from './types/attendance.types'
import {
  formatDateTime,
  formatWorkedMinutes,
  getDefaultDateRange,
  isRangeLongerThanOneMonth,
} from './utils/attendance-format'
import { useAuthStore } from '@/stores/authStore'

export default function AttendancePage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const defaultRange = useMemo(() => getDefaultDateRange(), [])
  const [fromDate, setFromDate] = useState(defaultRange.fromDate)
  const [toDate, setToDate] = useState(defaultRange.toDate)
  const [status, setStatus] = useState<AttendanceStatus>('CLOSED')

  const rangeInvalid = isRangeLongerThanOneMonth(fromDate, toDate)

  const summaryQuery = useQuery({
    queryKey: ['attendance-summary', fromDate, toDate, status],
    queryFn: () => attendanceApi.getSummary({ fromDate, toDate, status }),
    enabled: user?.role === 'OWNER' && Boolean(fromDate && toDate && !rangeInvalid),
  })

  const summary = summaryQuery.data?.data
  const employees = summary?.employees ?? []

  const openDetail = (userId: number) => {
    const params = new URLSearchParams({ fromDate, toDate, status })
    navigate(`/admin/attendance/${userId}?${params.toString()}`)
  }

  if (user?.role === 'STAFF') {
    return <Navigate to={`/admin/attendance/${user.id}`} replace />
  }

  return (
    <div className="min-h-[calc(100vh-1.5rem)] rounded-2xl bg-[#d2f2e7] p-1.5 text-[#022c22] sm:p-4">
      <div className="space-y-1.5 sm:space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-1.5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div>
          <h1 className="flex items-center gap-1 text-xs font-black leading-none tracking-[-0.04em] text-[#022c22] sm:text-3xl">
            <CalendarClock className="h-4 w-4 sm:h-7 sm:w-7 text-[#007a55]" />
            Chấm công
          </h1>
        </div>

        <Card className="border-[#e5e7eb] bg-white shadow-sm rounded-lg py-1 sm:py-3 px-1.5 sm:px-3">
          <CardContent className="space-y-1.5 sm:space-y-3 px-1.5 py-0.5 sm:p-4">
            <div className="grid gap-1.5 sm:gap-3 grid-cols-3">
              <div className="space-y-0.5">
                <Label htmlFor="attendanceFromDate" className="text-[8px] sm:text-xs">Từ ngày</Label>
                <Input
                  id="attendanceFromDate"
                  type="date"
                  className="h-7 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="attendanceToDate" className="text-[8px] sm:text-xs">Đến ngày</Label>
                <Input
                  id="attendanceToDate"
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
            value={formatWorkedMinutes(summary?.totalWorkedMinutes ?? 0)}
            icon={<Clock3 className="h-2.5 w-2.5 sm:h-5 sm:w-5" />}
          />
          <MetricCard
            title="Tổng số ca"
            value={String(summary?.totalShifts ?? 0)}
            icon={<CalendarClock className="h-2.5 w-2.5 sm:h-5 sm:w-5" />}
          />
          <MetricCard
            title="Có ca"
            value={String(summary?.totalEmployees ?? 0)}
            icon={<Users className="h-2.5 w-2.5 sm:h-5 sm:w-5" />}
          />
          <MetricCard
            title="Nhiều nhất"
            value={summary?.topEmployee?.fullName ?? '—'}
            subValue={summary?.topEmployee ? formatWorkedMinutes(summary.topEmployee.totalWorkedMinutes) : undefined}
            icon={<Trophy className="h-2.5 w-2.5 sm:h-5 sm:w-5" />}
          />
        </div>

        <Card className="border-[#e5e7eb] bg-white shadow-sm rounded-lg py-1 sm:py-3 px-1.5 sm:px-3">
          <CardHeader className="p-1 sm:p-4 pb-0.5 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-lg font-black tracking-[-0.03em] text-[#022c22]">Bảng chấm công nhân viên</CardTitle>
          </CardHeader>
          <CardContent className="p-1 sm:p-4 pt-0 sm:pt-0">
            {summaryQuery.isLoading ? (
              <div className="flex min-h-24 items-center justify-center gap-1 text-[#71717a] text-[9px] sm:text-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang tải dữ liệu chấm công...
              </div>
            ) : summaryQuery.isError ? (
              <div className="flex min-h-24 flex-col items-center justify-center gap-1.5">
                <p className="text-destructive text-[9px] sm:text-sm">Không thể tải dữ liệu chấm công.</p>
                <Button variant="outline" size="sm" className="h-6 sm:h-9 text-[9px] sm:text-sm" onClick={() => summaryQuery.refetch()}>Thử lại</Button>
              </div>
            ) : employees.length === 0 ? (
              <div className="flex min-h-24 items-center justify-center text-[#71717a] text-[9px] sm:text-sm">
                Chưa có ca làm phù hợp với bộ lọc.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-[#e5e7eb] ">
                <Table className="min-w-[460px] sm:min-w-[720px] table-fixed">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-[#022c22] border-b border-[#022c22]">
                      <TableHead className="w-[90px] sm:w-[180px] px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[8px] sm:text-xs">Nhân viên</TableHead>
                      <TableHead className="w-[75px] sm:w-[110px] px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[8px] sm:text-xs">SĐT</TableHead>
                      <TableHead className="w-[40px] sm:w-[80px] px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-center text-[8px] sm:text-xs">Số ca</TableHead>
                      <TableHead className="w-[60px] sm:w-[100px] px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-right text-[8px] sm:text-xs">Tổng giờ</TableHead>
                      <TableHead className="w-[60px] sm:w-[100px] px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-right text-[8px] sm:text-xs">TB / ca</TableHead>
                      <TableHead className="w-[90px] sm:w-[140px] px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[8px] sm:text-xs">Lần gần nhất</TableHead>
                      <TableHead className="w-[45px] sm:w-[80px] px-1 py-1 sm:px-3 sm:py-2 text-right font-bold text-white text-[8px] sm:text-xs">Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.userId}>
                        <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 truncate font-bold text-[#022c22] text-[8px] sm:text-sm">{employee.fullName}</TableCell>
                        <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 truncate text-[8px] sm:text-sm text-[#71717a]">{employee.phone || '—'}</TableCell>
                        <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-center">
                          <Badge variant="secondary" className="px-1 py-0 sm:px-2 sm:py-0.5 text-[7px] sm:text-xs scale-[0.8] sm:scale-100 origin-center">{employee.totalShifts}</Badge>
                        </TableCell>
                        <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-right font-bold text-[#007a55] text-[8px] sm:text-sm">
                          {formatWorkedMinutes(employee.totalWorkedMinutes)}
                        </TableCell>
                        <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-right text-[8px] sm:text-sm text-[#71717a]">
                          {formatWorkedMinutes(Math.round(employee.averageHoursPerShift * 60))}
                        </TableCell>
                        <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-[8px] sm:text-sm text-[#71717a]">{formatDateTime(employee.lastShiftAt)}</TableCell>
                        <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-right whitespace-nowrap">
                          <Button variant="ghost" size="sm" className="h-5 sm:h-8 px-1 sm:px-3 text-[8px] sm:text-sm" onClick={() => openDetail(employee.userId)}>
                            Xem
                            <ArrowRight className="ml-0.5 h-2.5 w-2.5 sm:h-4 sm:w-4" />
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
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  subValue,
  icon,
}: {
  title: string
  value: string
  subValue?: string
  icon: ReactNode
}) {
  return (
    <Card className="border-[#e5e7eb] bg-white shadow-sm rounded-lg py-1 sm:py-3 px-1.5 sm:px-3 flex flex-col gap-0.5 sm:gap-1.5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
        <CardTitle className="text-[7px] sm:text-xs font-medium text-muted-foreground truncate mr-0.5">{title}</CardTitle>
        <div className="text-[#007a55] shrink-0">{icon}</div>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-[9px] sm:text-lg font-black text-[#022c22] truncate leading-tight">{value}</p>
        {subValue && <p className="text-[6px] sm:text-xs text-muted-foreground truncate leading-none mt-0.5">{subValue}</p>}
      </CardContent>
    </Card>
  )
}
