export type ExpenseType = 'INGREDIENT' | 'PACKAGING' | 'UTILITY' | 'REPAIR' | 'OTHER'

export interface Expense {
  id: number
  type: ExpenseType
  title: string
  amount: number
  incurredAt: string
  shiftId: number | null
  shiftLabel: string | null
  createdById: number
  createdByName: string
  receiptImageUrl: string | null
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface ExpenseRequest {
  type: ExpenseType
  title: string
  amount: number
  incurredAt?: string
  attachToCurrentShift: boolean
  note?: string
  receiptImageUrl?: string
}

export interface ExpenseParams {
  type?: ExpenseType
  shiftOnly?: boolean
  keyword?: string
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
