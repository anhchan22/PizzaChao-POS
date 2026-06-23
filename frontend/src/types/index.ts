// ─── Enums matching backend ─────────────────────────────────────────
export type UserRole = 'OWNER' | 'STAFF'
export type UserStatus = 'ACTIVE' | 'INACTIVE'

// ─── API Response Wrapper ───────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

// ─── User ───────────────────────────────────────────────────────────
export interface User {
  id: number
  username: string
  fullName: string
  phone: string | null
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

// ─── Auth ───────────────────────────────────────────────────────────
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  user: User
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// ─── User Management ───────────────────────────────────────────────
export interface CreateUserRequest {
  username: string
  password: string
  fullName: string
  phone?: string
  role: UserRole
}

export interface UpdateUserRequest {
  fullName: string
  phone?: string
}

export interface UpdateUserStatusRequest {
  status: UserStatus
}

export interface ResetPasswordRequest {
  newPassword: string
}

// --- Phase 2: Menu & Product Management ------------------------------
export type ProductStatus = 'ACTIVE' | 'SOLD_OUT' | 'INACTIVE'

export interface ProductCategory {
  id: number
  name: string
  description: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Size {
  id: number
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface ProductOption {
  id: number
  name: string
  price: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id: number
  size: Size
  price: number
}

export interface Product {
  id: number
  category: ProductCategory
  name: string
  description: string
  imageUrl: string
  status: ProductStatus
  basePrice: number
  variants: ProductVariant[]
  createdAt: string
  updatedAt: string
}

// --- Phase 2 Requests ------------------------------------------------
export interface CategoryRequest {
  name: string
  description?: string
  sortOrder?: number
  isActive?: boolean
}

export interface SizeRequest {
  name: string
  description?: string
}

export interface OptionRequest {
  name: string
  price: number
  isActive?: boolean
}

export interface VariantRequest {
  sizeId: number
  price: number
}

export interface ProductRequest {
  categoryId: number
  name: string
  description?: string
  imageUrl?: string
  status?: ProductStatus
  basePrice: number
  variants?: VariantRequest[]
}

// --- Phase 2 POS Response ------------------------------------------
export interface PosProduct {
  id: number
  name: string
  description: string
  imageUrl: string
  status: ProductStatus
  basePrice: number
  variants: ProductVariant[]
}

export interface PosCategory {
  id: number
  name: string
  sortOrder: number
  products: PosProduct[]
}
