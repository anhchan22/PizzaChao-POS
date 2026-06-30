import axiosInstance from '@/apis/axios'
import type { ApiResponse } from '@/types'
import type {
  AttendanceNoteRequest,
  AttendanceParams,
  AttendanceShift,
  AttendanceSummary,
  EmployeeAttendanceDetail,
} from '../types/attendance.types'

export const attendanceApi = {
  getSummary: async (params: AttendanceParams): Promise<ApiResponse<AttendanceSummary>> => {
    const response = await axiosInstance.get<ApiResponse<AttendanceSummary>>('/attendance/summary', {
      params,
    })
    return response.data
  },

  getEmployeeDetail: async (
    userId: number,
    params: AttendanceParams,
  ): Promise<ApiResponse<EmployeeAttendanceDetail>> => {
    const response = await axiosInstance.get<ApiResponse<EmployeeAttendanceDetail>>(
      `/attendance/users/${userId}`,
      { params },
    )
    return response.data
  },

  updateNote: async (
    shiftId: number,
    data: AttendanceNoteRequest,
  ): Promise<ApiResponse<AttendanceShift>> => {
    const response = await axiosInstance.patch<ApiResponse<AttendanceShift>>(
      `/attendance/shifts/${shiftId}/note`,
      data,
    )
    return response.data
  },
}
