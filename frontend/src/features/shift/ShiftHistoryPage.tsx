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
    <div className="min-h-[calc(100vh-1.5rem)] rounded-2xl bg-[#d2f2e7] p-1.5 text-[#022c22] sm:p-4">
      <div className="space-y-1.5 sm:space-y-4 rounded-xl border border-[#e5e7eb] bg-white p-1.5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div>
          <h1 className="flex items-center gap-1 text-xs font-black leading-none tracking-[-0.04em] text-[#022c22] sm:text-3xl">
            <History className="h-4 w-4 sm:h-7 sm:w-7 text-[#007a55]" />
            Lịch sử ca làm việc
          </h1>
        </div>

        <Card className="border-[#e5e7eb] bg-white shadow-sm rounded-lg py-1 sm:py-3 px-1.5 sm:px-3">
          <CardContent className="grid gap-1.5 sm:gap-3 p-1.5 sm:p-4 grid-cols-3 md:grid-cols-3">
            <div className="space-y-0.5">
              <Label className="text-[8px] sm:text-xs">Trạng thái</Label>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value as 'ALL' | ShiftStatus)
                  setPage(0)
                }}
              >
                <SelectTrigger className="h-7 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs sm:text-sm">Tất cả</SelectItem>
                  <SelectItem value="OPEN" className="text-xs sm:text-sm">Đang mở</SelectItem>
                  <SelectItem value="CLOSED" className="text-xs sm:text-sm">Đã đóng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="fromDate" className="text-[8px] sm:text-xs">Từ ngày</Label>
              <Input
                id="fromDate"
                type="date"
                className="h-7 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                value={fromDate}
                onChange={(event) => {
                  setFromDate(event.target.value)
                  setPage(0)
                }}
              />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="toDate" className="text-[8px] sm:text-xs">Đến ngày</Label>
              <Input
                id="toDate"
                type="date"
                className="h-7 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                value={toDate}
                onChange={(event) => {
                  setToDate(event.target.value)
                  setPage(0)
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e5e7eb] bg-white shadow-sm rounded-lg">
          <CardContent className="p-0">
            {historyQuery.isLoading ? (
              <div className="flex min-h-24 items-center justify-center gap-1 text-[#71717a] text-[9px] sm:text-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang tải lịch sử ca...
              </div>
            ) : historyQuery.isError ? (
              <div className="flex min-h-24 flex-col items-center justify-center gap-1.5">
                <p className="text-destructive text-[9px] sm:text-sm">Không thể tải lịch sử ca làm việc.</p>
                <Button variant="outline" size="sm" className="h-6 sm:h-9 text-[9px] sm:text-sm" onClick={() => historyQuery.refetch()}>Thử lại</Button>
              </div>
            ) : !result?.content.length ? (
              <div className="flex min-h-24 items-center justify-center text-[#71717a] text-[9px] sm:text-sm">
                Không có ca làm việc phù hợp.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-[#e5e7eb]">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-[#022c22] border-b border-[#022c22]">
                        <TableHead className="px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[9px] sm:text-xs">Nhân viên</TableHead>
                        <TableHead className="px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[9px] sm:text-xs">Mở ca</TableHead>
                        <TableHead className="px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[9px] sm:text-xs">Đóng ca</TableHead>
                        <TableHead className="w-16 px-1 py-1 sm:px-3 sm:py-2 text-right font-bold text-white text-[9px] sm:text-xs">Đầu ca</TableHead>
                        <TableHead className="w-16 px-1 py-1 sm:px-3 sm:py-2 text-right font-bold text-white text-[9px] sm:text-xs">Dự kiến</TableHead>
                        <TableHead className="w-16 px-1 py-1 sm:px-3 sm:py-2 text-right font-bold text-white text-[9px] sm:text-xs">Thực tế</TableHead>
                        <TableHead className="w-16 px-1 py-1 sm:px-3 sm:py-2 text-right font-bold text-white text-[9px] sm:text-xs">Chênh lệch</TableHead>
                        <TableHead className="w-16 px-1 py-1 sm:px-3 sm:py-2 font-bold text-white text-[9px] sm:text-xs">Trạng thái</TableHead>
                        <TableHead className="w-16 px-1 py-1 sm:px-3 sm:py-2 text-right font-bold text-white text-[9px] sm:text-xs">Chi tiết</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.content.map((shift) => (
                        <TableRow key={shift.id}>
                          <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 font-bold text-[#022c22] text-[9px] sm:text-sm">{shift.openedByName}</TableCell>
                          <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-[9px] sm:text-sm text-[#71717a]">{new Date(shift.openedAt).toLocaleString('vi-VN')}</TableCell>
                          <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-[9px] sm:text-sm text-[#71717a]">{shift.closedAt ? new Date(shift.closedAt).toLocaleString('vi-VN') : '—'}</TableCell>
                          <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-right text-[9px] sm:text-sm text-[#71717a]">{currency.format(shift.startingCash)}</TableCell>
                          <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-right text-[9px] sm:text-sm text-[#71717a]">{currency.format(shift.expectedCash)}</TableCell>
                          <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-right text-[9px] sm:text-sm text-[#71717a]">
                            {shift.actualCash === null ? '—' : currency.format(shift.actualCash)}
                          </TableCell>
                          <TableCell className={`px-1 py-0.5 sm:px-3 sm:py-2 text-right font-bold text-[9px] sm:text-sm ${
                            (shift.cashDifference ?? 0) < 0
                              ? 'text-destructive'
                              : (shift.cashDifference ?? 0) > 0
                                ? 'text-amber-600'
                                : ''
                          }`}>
                            {shift.cashDifference === null ? '—' : currency.format(shift.cashDifference)}
                          </TableCell>
                          <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2">
                            <Badge variant={shift.status === 'OPEN' ? 'default' : 'secondary'} className="px-1 py-0 sm:px-2 sm:py-0.5 text-[8px] sm:text-xs scale-[0.8] sm:scale-100 origin-left whitespace-nowrap">
                              {shift.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-1 py-0.5 sm:px-3 sm:py-2 text-right whitespace-nowrap">
                            <Button
                              variant="ghost"
                              className="h-5 sm:h-8 px-1.5 sm:px-3 text-[9px] sm:text-sm"
                              onClick={() => setSelectedShift(shift)}
                            >
                              <Eye className="mr-0.5 h-2.5 w-2.5 sm:h-4 sm:w-4" />
                              Xem
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-2 sm:mt-4 flex items-center justify-between px-1.5 sm:px-3">
                  <p className="text-[9px] sm:text-sm text-[#71717a]">Tổng cộng {result.totalElements} ca</p>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-5 w-5 sm:h-8 sm:w-8 p-0"
                      disabled={result.first}
                      onClick={() => setPage((current) => Math.max(0, current - 1))}
                    >
                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <span className="text-[9px] sm:text-sm text-[#71717a]">Trang {result.number + 1}/{Math.max(result.totalPages, 1)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-5 w-5 sm:h-8 sm:w-8 p-0"
                      disabled={result.last}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
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
