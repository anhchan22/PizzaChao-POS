import axiosInstance from '@/apis/axios'
import type { ApiResponse } from '@/types'
import type { InventoryItem, InventoryItemRequest, StockInRequest, StockMovement } from '../types/inventory.types'

export const inventoryApi = {
  getAll: async (params: { active?: boolean; keyword?: string }): Promise<ApiResponse<InventoryItem[]>> => {
    const response = await axiosInstance.get<ApiResponse<InventoryItem[]>>('/inventory-items', { params })
    return response.data
  },

  getLowStock: async (): Promise<ApiResponse<InventoryItem[]>> => {
    const response = await axiosInstance.get<ApiResponse<InventoryItem[]>>('/inventory-items/low-stock')
    return response.data
  },

  create: async (data: InventoryItemRequest): Promise<ApiResponse<InventoryItem>> => {
    const response = await axiosInstance.post<ApiResponse<InventoryItem>>('/inventory-items', data)
    return response.data
  },

  update: async (id: number, data: InventoryItemRequest): Promise<ApiResponse<InventoryItem>> => {
    const response = await axiosInstance.put<ApiResponse<InventoryItem>>(`/inventory-items/${id}`, data)
    return response.data
  },

  stockIn: async (id: number, data: StockInRequest): Promise<ApiResponse<InventoryItem>> => {
    const response = await axiosInstance.post<ApiResponse<InventoryItem>>(`/inventory-items/${id}/stock-in`, data)
    return response.data
  },

  getMovements: async (id: number): Promise<ApiResponse<StockMovement[]>> => {
    const response = await axiosInstance.get<ApiResponse<StockMovement[]>>(`/inventory-items/${id}/movements`)
    return response.data
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/inventory-items/${id}`)
    return response.data
  },
}
