export type ShiftStatus = 'OPEN' | 'CLOSED'

export interface Shift {
  id: number
  openedById: number
  openedByName: string
  closedByName: string | null
  openedAt: string
  closedAt: string | null
  startingCash: number
  expectedCash: number
  actualCash: number | null
  cashDifference: number | null
  openingNote: string | null
  closingNote: string | null
  workedMinutes: number | null
  attendanceNote: string | null
  status: ShiftStatus
}

export interface ShiftOpenRequest {
  startingCash: number
  openingNote?: string
}

export interface ShiftCloseRequest {
  actualCash: number
  closingNote?: string
  inventoryCounts?: Array<{
    inventoryItemId: number
    actualQuantity: number
    note?: string
  }>
}

export interface ShiftHistoryParams {
  userId?: number
  status?: ShiftStatus
  fromDate?: string
  toDate?: string
  page?: number
  size?: number
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}
