// frontend/src/store/ownerStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Owner {
  id: number;
  owner_name: string;
  access_token: string;
  properties_count: number;
}

interface OwnerState {
  owner: Owner | null;
  isAuthenticated: boolean;
  setAuth: (owner: Owner, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updatePropertiesCount: (count: number) => void;
}

export const useOwnerStore = create<OwnerState>()(
  persist(
    (set) => ({
      owner: null,
      isAuthenticated: false,

      setAuth: (owner, accessToken, refreshToken) => {
        // Сохраняем токены в localStorage
        localStorage.setItem('ownerAccessToken', accessToken);
        localStorage.setItem('ownerRefreshToken', refreshToken);
        
        set({
          owner,
          isAuthenticated: true
        });
      },

      clearAuth: () => {
        // Очищаем токены из localStorage
        localStorage.removeItem('ownerAccessToken');
        localStorage.removeItem('ownerRefreshToken');
        
        set({
          owner: null,
          isAuthenticated: false
        });
      },

      updatePropertiesCount: (count) =>
        set((state) => ({
          owner: state.owner ? { ...state.owner, properties_count: count } : null
        }))
    }),
    {
      name: 'owner-storage'
    }
  )
);