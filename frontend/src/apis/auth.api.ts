import api from './axios'
import type { ApiResponse, LoginRequest, LoginResponse, ChangePasswordRequest, User } from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', data),

  getMe: () =>
    api.get<ApiResponse<User>>('/auth/me'),

  logout: () =>
    api.post<ApiResponse<void>>('/auth/logout'),

  changePassword: (data: ChangePasswordRequest) =>
    api.post<ApiResponse<void>>('/auth/change-password', data),
}
