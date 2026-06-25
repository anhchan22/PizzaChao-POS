import { create } from 'zustand'
import type { User } from '@/types'
import { authApi } from '@/apis/auth.api'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  setUser: (user: User) => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username: string, password: string) => {
    const res = await authApi.login({ username, password })
    const { accessToken, user } = res.data.data

    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('user', JSON.stringify(user))

    set({
      token: accessToken,
      user,
      isAuthenticated: true,
    })
  },

  logout: async () => {
    await authApi.logout()
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')

    set({
      token: null,
      user: null,
      isAuthenticated: false,
    })
  },

  fetchMe: async () => {
    try {
      const res = await authApi.getMe()
      const user = res.data.data
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, isAuthenticated: true })
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      set({
        token: null,
        user: null,
        isAuthenticated: false,
      })
    }
  },

  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },

  hydrate: () => {
    const token = localStorage.getItem('access_token')
    const userStr = localStorage.getItem('user')

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User
        set({ token, user, isAuthenticated: true, isLoading: false })
      } catch {
        set({ isLoading: false })
      }
    } else {
      set({ isLoading: false })
    }
  },
}))
