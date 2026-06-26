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
  receivedAmount?: number
  paymentReference?: string
  paymentConfirmed: boolean
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
  status: OrderStatus
  paymentMethod: 'CASH' | 'TRANSFER'
  receivedAmount?: number
  changeAmount?: number
  paymentReference?: string
  totalAmount: number
  note?: string
  cancelReason?: string
  createdBy: string
  createdAt: string
  completedAt?: string
  cancelledAt?: string
  queueNumber: number
  items: OrderItemResponse[]
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
export type OrderQueueFilter = 'UNFINISHED' | 'COMPLETED' | 'CANCELLED' | 'ALL'

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
    
  getAll: (params?: { keyword?: string; status?: OrderQueueFilter; page?: number; size?: number }) =>
    axiosInstance.get<OrderListResponse>('/orders', { params }).then(res => res.data),
    
  getById: (id: number) => 
    axiosInstance.get<OrderResponse>(`/orders/${id}`).then(res => res.data),
    
  updateStatus: (id: number, status: 'COMPLETED' | 'CANCELLED', reason?: string) =>
    axiosInstance.patch<OrderResponse>(`/orders/${id}/status`, { status, reason }).then(res => res.data),
}
