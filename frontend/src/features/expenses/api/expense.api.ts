import axiosInstance from '@/apis/axios'
import type { ApiResponse } from '@/types'
import type { Expense, ExpenseParams, ExpenseRequest, PageResponse } from '../types/expense.types'

export const expenseApi = {
  getAll: async (params: ExpenseParams): Promise<ApiResponse<PageResponse<Expense>>> => {
    const response = await axiosInstance.get<ApiResponse<PageResponse<Expense>>>('/expenses', { params })
    return response.data
  },

  create: async (data: ExpenseRequest): Promise<ApiResponse<Expense>> => {
    const response = await axiosInstance.post<ApiResponse<Expense>>('/expenses', data)
    return response.data
  },

  update: async (id: number, data: ExpenseRequest): Promise<ApiResponse<Expense>> => {
    const response = await axiosInstance.put<ApiResponse<Expense>>(`/expenses/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/expenses/${id}`)
    return response.data
  },
}
