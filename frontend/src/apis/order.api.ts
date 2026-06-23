import axiosInstance from './axios'

export interface OrderItemOptionRequest {
  optionId: number
}

export interface OrderItemRequest {
  productId: number
  sizeId: number
  quantity: number
  note?: string
  optionIds?: number[]
}

export interface OrderRequest {
  customerName?: string
  customerPhone?: string
  paymentMethod: 'CASH' | 'TRANSFER'
  note?: string
  items: OrderItemRequest[]
}

export interface OrderItemOptionResponse {
  id: number
  optionId: number
  optionName: string
  price: number
}

export interface OrderItemResponse {
  id: number
  productId: number
  productName: string
  sizeId: number
  sizeName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  note?: string
  options: OrderItemOptionResponse[]
}

export interface OrderResponse {
  id: number
  orderCode: string
  customerName?: string
  customerPhone?: string
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  paymentMethod: 'CASH' | 'TRANSFER'
  totalAmount: number
  note?: string
  createdBy: string
  createdAt: string
  items: OrderItemResponse[]
}

export interface OrderListResponse {
  content: OrderResponse[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export const orderApi = {
  create: (data: OrderRequest) => 
    axiosInstance.post<OrderResponse>('/orders', data).then(res => res.data),
    
  getAll: (params?: { keyword?: string; status?: string; page?: number; size?: number }) => 
    axiosInstance.get<OrderListResponse>('/orders', { params }).then(res => res.data),
    
  getById: (id: number) => 
    axiosInstance.get<OrderResponse>(`/orders/${id}`).then(res => res.data),
    
  updateStatus: (id: number, status: 'PENDING' | 'COMPLETED' | 'CANCELLED') => 
    axiosInstance.patch<OrderResponse>(`/orders/${id}/status`, { status }).then(res => res.data),
}
