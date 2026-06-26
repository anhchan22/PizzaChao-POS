export interface InventoryUsageRule {
  id: number
  sizeId: number
  sizeName: string
  quantityPerOrder: number
}

export interface InventoryItem {
  id: number
  name: string
  unit: string
  currentQuantity: number
  warningQuantity: number
  estimatedUsed: number
  estimatedRemaining: number
  lowStock: boolean
  lastStocktakeAt: string
  active: boolean
  note: string | null
  usageRules: InventoryUsageRule[]
  createdAt: string
  updatedAt: string
}

export interface InventoryUsageRuleRequest {
  sizeId: number
  quantityPerOrder: number
}

export interface InventoryItemRequest {
  name: string
  unit: string
  currentQuantity: number
  warningQuantity: number
  active: boolean
  note?: string
  usageRules: InventoryUsageRuleRequest[]
}

export type StockMovementType = 'IN' | 'OUT' | 'AUTO_DEDUCT' | 'SHIFT_CLOSE_ADJUST'

export interface StockMovement {
  id: number
  inventoryItemId: number
  inventoryItemName: string
  shiftId: number | null
  type: StockMovementType
  quantityChange: number
  beforeQuantity: number
  afterQuantity: number
  note: string | null
  createdById: number | null
  createdByName: string | null
  createdAt: string
}

export interface StockInRequest {
  quantity: number
  note?: string
}
