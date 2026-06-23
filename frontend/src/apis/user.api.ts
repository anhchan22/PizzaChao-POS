import api from './axios'
import type {
  ApiResponse,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  ResetPasswordRequest,
} from '@/types'

export const userApi = {
  getAll: (params?: { role?: string; status?: string; keyword?: string }) =>
    api.get<ApiResponse<User[]>>('/users', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<User>>(`/users/${id}`),

  create: (data: CreateUserRequest) =>
    api.post<ApiResponse<User>>('/users', data),

  update: (id: number, data: UpdateUserRequest) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data),

  updateStatus: (id: number, data: UpdateUserStatusRequest) =>
    api.patch<ApiResponse<User>>(`/users/${id}/status`, data),

  resetPassword: (id: number, data: ResetPasswordRequest) =>
    api.post<ApiResponse<void>>(`/users/${id}/reset-password`, data),
}
