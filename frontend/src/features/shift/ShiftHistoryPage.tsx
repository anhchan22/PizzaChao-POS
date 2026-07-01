import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Eye, Loader2, History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { shiftApi } from './api/shift.api'
import type { Shift, ShiftStatus } from './types/shift.types'

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export function ShiftHistoryPage() {
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState<'ALL' | ShiftStatus>('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)

  const historyQuery = useQuery({
    queryKey: ['shift-history', page, status, fromDate, toDate],
    queryFn: () => shiftApi.getHistory({
      page,
      size: 20,
      status: status === 'ALL' ? undefined : status,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }),
  })

  const result = historyQuery.data?.data

  return (
    <div className="min-h-[calc(100vh-1.5rem)] rounded-2xl bg-[#d2f2e7] p-3 text-[#022c22] sm:p-4">
      <div className="space-y-6 rounded-2xl border border-[#e5e7eb] bg-white/90 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black leading-none tracking-[-0.04em] text-[#022c22] sm:text-3xl">
          <History className="h-7 w-7 text-[#007a55]" />
          Lịch sử ca làm việc
        </h1>
      </div>

      <Card>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as 'ALL' | ShiftStatus)
                setPage(0)
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="OPEN">Đang mở</SelectItem>
                <SelectItem value="CLOSED">Đã đóng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromDate">Từ ngày</Label>
            <Input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(event) => {
                setFromDate(event.target.value)
                setPage(0)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toDate">Đến ngày</Label>
            <Input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(event) => {
                setToDate(event.target.value)
                setPage(0)
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {historyQuery.isLoading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang tải lịch sử ca...
            </div>
          ) : historyQuery.isError ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3">
              <p className="text-destructive">Không thể tải lịch sử ca làm việc.</p>
              <Button variant="outline" onClick={() => historyQuery.refetch()}>Thử lại</Button>
            </div>
          ) : !result?.content.length ? (
            <div className="flex min-h-48 items-center justify-center text-muted-foreground">
              Không có ca làm việc phù hợp.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nhân viên</TableHead>
                      <TableHead>Mở ca</TableHead>
                      <TableHead>Đóng ca</TableHead>
                      <TableHead className="text-right">Đầu ca</TableHead>
                      <TableHead className="text-right">Dự kiến</TableHead>
                      <TableHead className="text-right">Thực tế</TableHead>
                      <TableHead className="text-right">Chênh lệch</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.content.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">{shift.openedByName}</TableCell>
                        <TableCell>{new Date(shift.openedAt).toLocaleString('vi-VN')}</TableCell>
                        <TableCell>{shift.closedAt ? new Date(shift.closedAt).toLocaleString('vi-VN') : '—'}</TableCell>
                        <TableCell className="text-right">{currency.format(shift.startingCash)}</TableCell>
                        <TableCell className="text-right">{currency.format(shift.expectedCash)}</TableCell>
                        <TableCell className="text-right">
                          {shift.actualCash === null ? '—' : currency.format(shift.actualCash)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          (shift.cashDifference ?? 0) < 0
                            ? 'text-destructive'
                            : (shift.cashDifference ?? 0) > 0
                              ? 'text-amber-600'
                              : ''
                        }`}>
                          {shift.cashDifference === null ? '—' : currency.format(shift.cashDifference)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={shift.status === 'OPEN' ? 'default' : 'secondary'}>
                            {shift.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedShift(shift)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Xem
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Tổng cộng {result.totalElements} ca · 20 ca/trang</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={result.first}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">Trang {result.number + 1}/{Math.max(result.totalPages, 1)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={result.last}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={selectedShift !== null} onOpenChange={(open) => !open && setSelectedShift(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Chi tiết ca #{selectedShift?.id}</DialogTitle>
          </DialogHeader>

          {selectedShift && (
            <div className="space-y-5 py-2">
              <div className="grid gap-3 rounded-lg bg-muted p-4 text-sm sm:grid-cols-2">
                <DetailItem label="Người mở ca" value={selectedShift.openedByName} />
                <DetailItem label="Người đóng ca" value={selectedShift.closedByName ?? '—'} />
                <DetailItem
                  label="Thời gian mở"
                  value={new Date(selectedShift.openedAt).toLocaleString('vi-VN')}
                />
                <DetailItem
                  label="Thời gian đóng"
                  value={selectedShift.closedAt
                    ? new Date(selectedShift.closedAt).toLocaleString('vi-VN')
                    : '—'}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <MoneyItem label="Tiền đầu ca" value={selectedShift.startingCash} />
                <MoneyItem label="Tiền dự kiến" value={selectedShift.expectedCash} />
                <MoneyItem label="Tiền thực tế" value={selectedShift.actualCash} />
                <MoneyItem
                  label="Chênh lệch"
                  value={selectedShift.cashDifference}
                  highlight
                />
              </div>

              <div className="space-y-3">
                <NoteItem label="Ghi chú đầu ca" value={selectedShift.openingNote} />
                <NoteItem
                  label="Ghi chú đóng ca / lý do chênh lệch"
                  value={selectedShift.closingNote}
                  important={(selectedShift.cashDifference ?? 0) !== 0}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}

function MoneyItem({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number | null
  highlight?: boolean
}) {
  const differenceClass = highlight && value !== null
    ? value < 0
      ? 'text-destructive'
      : value > 0
        ? 'text-amber-600'
        : 'text-emerald-600'
    : ''

  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${differenceClass}`}>
        {value === null ? '—' : currency.format(value)}
      </p>
    </div>
  )
}

function NoteItem({
  label,
  value,
  important = false,
}: {
  label: string
  value: string | null
  important?: boolean
}) {
  return (
    <div className={`rounded-lg border p-4 ${important ? 'border-amber-500/40 bg-amber-500/10' : ''}`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm">{value || 'Không có ghi chú'}</p>
    </div>
  )
}
