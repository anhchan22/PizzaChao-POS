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
    <div className="min-h-[calc(100vh-1.5rem)] rounded-2xl bg-[#d2f2e7] p-3 text-[#022c22] sm:p-4">
      <div className="space-y-6 rounded-2xl border border-[#e5e7eb] bg-white/90 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black leading-none tracking-[-0.04em] text-[#022c22] sm:text-3xl">
          <CalendarClock className="h-7 w-7 text-primary" />
          Chấm công
        </h1>
      </div>

      <Card>

        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="attendanceFromDate">Từ ngày</Label>
              <Input
                id="attendanceFromDate"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendanceToDate">Đến ngày</Label>
              <Input
                id="attendanceToDate"
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
          value={formatWorkedMinutes(summary?.totalWorkedMinutes ?? 0)}
          icon={<Clock3 className="h-5 w-5" />}
        />
        <MetricCard
          title="Tổng số ca"
          value={String(summary?.totalShifts ?? 0)}
          icon={<CalendarClock className="h-5 w-5" />}
        />
        <MetricCard
          title="Nhân viên có ca"
          value={String(summary?.totalEmployees ?? 0)}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          title="Làm nhiều nhất"
          value={summary?.topEmployee?.fullName ?? '—'}
          subValue={summary?.topEmployee ? formatWorkedMinutes(summary.topEmployee.totalWorkedMinutes) : undefined}
          icon={<Trophy className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bảng chấm công nhân viên</CardTitle>
        </CardHeader>
        <CardContent>
          {summaryQuery.isLoading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang tải dữ liệu chấm công...
            </div>
          ) : summaryQuery.isError ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3">
              <p className="text-destructive">Không thể tải dữ liệu chấm công.</p>
              <Button variant="outline" onClick={() => summaryQuery.refetch()}>Thử lại</Button>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center text-muted-foreground">
              Chưa có ca làm phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#e5e7eb]">
              <Table className="min-w-[860px] table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">Nhân viên</TableHead>
                    <TableHead className="w-[130px]">SĐT</TableHead>
                    <TableHead className="w-[90px] text-center">Số ca</TableHead>
                    <TableHead className="w-[120px] text-right">Tổng giờ</TableHead>
                    <TableHead className="w-[110px] text-right">TB / ca</TableHead>
                    <TableHead className="w-[150px]">Lần gần nhất</TableHead>
                    <TableHead className="w-[90px] text-right">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.userId}>
                      <TableCell className="truncate font-medium">{employee.fullName}</TableCell>
                      <TableCell className="truncate">{employee.phone || '—'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{employee.totalShifts}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatWorkedMinutes(employee.totalWorkedMinutes)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatWorkedMinutes(Math.round(employee.averageHoursPerShift * 60))}
                      </TableCell>
                      <TableCell>{formatDateTime(employee.lastShiftAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openDetail(employee.userId)}>
                          Xem
                          <ArrowRight className="ml-2 h-4 w-4" />
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-black">{value}</p>
        {subValue && <p className="mt-1 text-xs text-muted-foreground">{subValue}</p>}
      </CardContent>
    </Card>
  )
}
