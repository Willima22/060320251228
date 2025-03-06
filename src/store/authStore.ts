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
  setUser: (user: User | null) => void;
  checkUser: () => Promise<void>;
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
            console.error('Erro na autenticação:', error);
            set({ error: error.message, isLoading: false });
            return;
          }
          
          if (data.user) {
            console.log('Usuário autenticado no Supabase:', data.user.email);
            
            // Fetch user profile from our custom table
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('email', email)
              .single();
              
            if (userError) {
              console.error('Erro ao buscar perfil do usuário:', userError);
              set({ error: userError.message, isLoading: false });
              return;
            }
            
            if (!userData) {
              console.error('Usuário não encontrado na tabela users');
              set({ error: 'Usuário não encontrado', isLoading: false });
              return;
            }
            
            console.log('Perfil do usuário encontrado:', userData);
            set({ 
              user: userData as User, 
              isAuthenticated: true, 
              isLoading: false 
            });
          }
        } catch (err) {
          console.error('Erro inesperado no login:', err);
          set({ error: 'Ocorreu um erro inesperado', isLoading: false });
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
      },
      
      setUser: (user) => set({ user }),
      
      checkUser: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          console.log('Usuário autenticado:', user);

          if (user) {
            // Buscar dados adicionais do usuário
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();

            console.log('Dados do usuário:', userData);
            console.log('Erro ao buscar usuário:', userError);

            if (userData) {
              set({ user: { ...user, ...userData } });
            } else {
              console.log('Usuário não encontrado na tabela users');
              set({ user: null });
            }
          } else {
            console.log('Nenhum usuário autenticado');
            set({ user: null });
          }
        } catch (error) {
          console.error('Erro ao verificar usuário:', error);
          set({ user: null });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);