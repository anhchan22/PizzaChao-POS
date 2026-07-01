import axiosInstance from './axios'

// Response types
export interface DashboardData {
  todayRevenue: number
  todayOrders: number
  cashRevenue: number
  transferRevenue: number
  cashCount: number
  transferCount: number
  todayExpenses: number
  estimatedProfit: number
  topProducts: TopProduct[]
  lowStockItems: LowStockItem[]
}

export interface TopProduct {
  productName: string
  quantitySold: number
  revenue: number
}

export interface LowStockItem {
  id: number
  name: string
  unit: string
  currentQuantity: number
  warningQuantity: number
}

export interface RevenueDataPoint {
  label: string
  revenue: number
  orderCount: number
}

export interface PaymentMethodStats {
  cashRevenue: number
  transferRevenue: number
  cashCount: number
  transferCount: number
}

export interface HourlySales {
  hour: number
  orderCount: number
  revenue: number
}

export interface ShiftSummary {
  shiftId: number
  staffName: string
  openedAt: string
  closedAt: string | null
  revenue: number
  orderCount: number
  cashDifference: number | null
}

export interface ProfitEstimate {
  revenue: number
  expenses: number
  expensesByType: { type: string; amount: number }[]
  profit: number
  profitMarginPercent: number | null
}

export interface CancelStats {
  totalCancelled: number
  totalLostRevenue: number
  topReasons: { reason: string; count: number }[]
}

export interface ReportRangeParams {
  from: string
  to: string
}

export const reportApi = {
  getDashboard: (params?: Partial<ReportRangeParams> & { date?: string; shiftId?: number }) =>
    axiosInstance.get<DashboardData>('/reports/dashboard', { params }).then(r => r.data),

  getRevenue: (params: { from: string; to: string; groupBy?: 'DAY' | 'WEEK' | 'MONTH' }) =>
    axiosInstance.get<RevenueDataPoint[]>('/reports/revenue', { params }).then(r => r.data),

  getRevenueByPaymentMethod: (params: { from: string; to: string }) =>
    axiosInstance.get<PaymentMethodStats>('/reports/revenue-by-payment-method', { params }).then(r => r.data),

  getTopProducts: (params: { from: string; to: string; limit?: number }) =>
    axiosInstance.get<TopProduct[]>('/reports/top-products', { params }).then(r => r.data),

  getHourlySales: (params?: Partial<ReportRangeParams> & { date?: string }) =>
    axiosInstance.get<HourlySales[]>('/reports/hourly-sales', { params }).then(r => r.data),

  getShiftSummary: (params: { from: string; to: string; userId?: number }) =>
    axiosInstance.get<ShiftSummary[]>('/reports/shift-summary', { params }).then(r => r.data),

  getProfitEstimate: (params: { from: string; to: string }) =>
    axiosInstance.get<ProfitEstimate>('/reports/profit-estimate', { params }).then(r => r.data),

  getCancelStats: (params: { from: string; to: string }) =>
    axiosInstance.get<CancelStats>('/reports/cancel-stats', { params }).then(r => r.data),
}
