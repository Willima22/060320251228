import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { supabase, signIn as supabaseSignIn, signOut as supabaseSignOut } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabaseSignIn(email, password);
          
          if (error) {
            set({ error: error.message, isLoading: false });
            return;
          }
          
          if (data.user) {
            // Fetch user profile from our custom table
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('email', email)
              .single();
              
            if (userError) {
              set({ error: userError.message, isLoading: false });
              return;
            }
            
            set({ 
              user: userData as User, 
              isAuthenticated: true, 
              isLoading: false 
            });
          }
        } catch (err) {
          set({ error: 'An unexpected error occurred', isLoading: false });
        }
      },
      
      signOut: async () => {
        set({ isLoading: true });
        try {
          const { error } = await supabaseSignOut();
          
          if (error) {
            set({ error: error.message, isLoading: false });
            return;
          }
          
          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (err) {
          set({ error: 'An unexpected error occurred', isLoading: false });
        }
      },
      
      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const { data } = await supabase.auth.getSession();
          
          if (data.session) {
            // Fetch user profile
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.session.user.id)
              .single();
              
            if (userError) {
              set({ user: null, isAuthenticated: false, isLoading: false });
              return;
            }
            
            set({ 
              user: userData as User, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch (err) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);