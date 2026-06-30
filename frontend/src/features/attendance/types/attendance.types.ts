export type AttendanceStatus = 'OPEN' | 'CLOSED'

export interface AttendanceParams {
  fromDate?: string
  toDate?: string
  userId?: number
  status?: AttendanceStatus
}

export interface AttendanceEmployeeSummary {
  userId: number
  fullName: string
  phone: string | null
  totalShifts: number
  totalWorkedMinutes: number
  totalWorkedHours: number
  averageHoursPerShift: number
  lastShiftAt: string | null
}

export interface AttendanceSummary {
  fromDate: string
  toDate: string
  totalEmployees: number
  totalShifts: number
  totalWorkedMinutes: number
  topEmployee: AttendanceEmployeeSummary | null
  employees: AttendanceEmployeeSummary[]
}

export interface AttendanceUser {
  id: number
  username: string
  fullName: string
  phone: string | null
  role: string
  status: string
}

export interface AttendanceTotals {
  totalShifts: number
  totalWorkedMinutes: number
  totalWorkedHours: number
  averageHoursPerShift: number
}

export interface AttendanceShift {
  shiftId: number
  workDate: string
  openedAt: string
  closedAt: string | null
  workedMinutes: number | null
  workedHours: number
  totalRevenue: number
  status: AttendanceStatus
  openingNote: string | null
  closingNote: string | null
  attendanceNote: string | null
}

export interface EmployeeAttendanceDetail {
  user: AttendanceUser
  summary: AttendanceTotals
  shifts: AttendanceShift[]
}

export interface AttendanceNoteRequest {
  attendanceNote?: string
}
