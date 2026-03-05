import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/axios'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await api.post('/auth/login/', { email, password })
        const { access, refresh, user } = res.data
        set({ user, token: access, refreshToken: refresh, isAuthenticated: true })
        return user
      },

      logout: () => {
        const refresh = get().refreshToken
        if (refresh) {
          api.post('/auth/logout/', { refresh }).catch(() => {})
        }
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
      },

      updateUser: (userData) => set({ user: { ...get().user, ...userData } }),

      refreshAccessToken: async () => {
        const refresh = get().refreshToken
        if (!refresh) return
        const res = await api.post('/auth/token/refresh/', { refresh })
        set({ token: res.data.access })
      },
    }),
    {
      name: 'floscent-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
