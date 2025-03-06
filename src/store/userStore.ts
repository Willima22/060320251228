import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  createUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getUser: (id: string) => Promise<void>;
  assignSurveyToUser: (userId: string, surveyId: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
  
  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set({ users: data as User[], isLoading: false });
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
  
  createUser: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password || 'tempPassword123', // Temporary password
        options: {
          data: {
            name: userData.name,
            role: userData.role,
          }
        }
      });
      
      if (authError) {
        set({ error: authError.message, isLoading: false });
        return;
      }
      
      if (!authData.user) {
        set({ error: 'Failed to create user', isLoading: false });
        return;
      }
      
      // Then create the user profile
      const newUser: User = {
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        cpf: userData.cpf,
        role: userData.role,
        firstAccess: true,
      };
      
      const { error } = await supabase
        .from('users')
        .insert(newUser);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set(state => ({ 
        users: [...state.users, newUser],
        isLoading: false 
      }));
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
  
  updateUser: async (id, userData) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set(state => ({
        users: state.users.map(user => 
          user.id === id ? { ...user, ...userData } : user
        ),
        currentUser: state.currentUser?.id === id 
          ? { ...state.currentUser, ...userData } 
          : state.currentUser,
        isLoading: false
      }));
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
  
  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Delete user from our custom table
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
        
      if (profileError) {
        set({ error: profileError.message, isLoading: false });
        return;
      }
      
      // Delete user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      
      if (authError) {
        set({ error: authError.message, isLoading: false });
        return;
      }
      
      set(state => ({
        users: state.users.filter(user => user.id !== id),
        currentUser: state.currentUser?.id === id ? null : state.currentUser,
        isLoading: false
      }));
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
  
  getUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set({ currentUser: data as User, isLoading: false });
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
  
  assignSurveyToUser: async (userId, surveyId) => {
    set({ isLoading: true, error: null });
    try {
      const assignment = {
        id: uuidv4(),
        surveyId,
        researcherId: userId,
        status: 'pending',
        assignedAt: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('survey_assignments')
        .insert(assignment);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set({ isLoading: false });
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
}));