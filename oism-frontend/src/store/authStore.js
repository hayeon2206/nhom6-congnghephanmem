import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),

      login: async (email, password) => {
        const { data } = await axios.post(`${baseURL}/api/auth/login`, { email, password });
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
        return data.user;
      },

      registerTenant: async (payload) => {
        const { data } = await axios.post(`${baseURL}/api/auth/register`, payload);
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
        return data.user;
      },

      refreshSession: async () => {
        const refreshToken = get().refreshToken;
        const { data } = await axios.post(`${baseURL}/api/auth/refresh`, { refreshToken });
        set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        return data.accessToken;
      },

      logout: () => {
        const refreshToken = get().refreshToken;
        if (refreshToken) {
          axios.post(`${baseURL}/api/auth/logout`, { refreshToken }).catch(() => {});
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    { name: 'oism-auth' },
  ),
);
