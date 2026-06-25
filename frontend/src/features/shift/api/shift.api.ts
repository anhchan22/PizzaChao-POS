import axiosInstance from '@/apis/axios'
import type { ApiResponse } from '@/types'
import type {
  PageResponse,
  Shift,
  ShiftCloseRequest,
  ShiftHistoryParams,
  ShiftOpenRequest,
} from '../types/shift.types'

export const shiftApi = {
  getCurrentShift: async (): Promise<ApiResponse<Shift | null>> => {
    const response = await axiosInstance.get<ApiResponse<Shift | null>>('/shifts/current')
    return response.data
  },

  openShift: async (data: ShiftOpenRequest): Promise<ApiResponse<Shift>> => {
    const response = await axiosInstance.post<ApiResponse<Shift>>('/shifts/open', data)
    return response.data
  },

  closeShift: async (data: ShiftCloseRequest): Promise<ApiResponse<Shift>> => {
    const response = await axiosInstance.post<ApiResponse<Shift>>('/shifts/close', data)
    return response.data
  },

  getHistory: async (
    params: ShiftHistoryParams,
  ): Promise<ApiResponse<PageResponse<Shift>>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<Shift>>>('/shifts', {
      params,
    })
    return response.data
  },
}
