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
  assignSurveyToUser: (researcherId: string, surveyId: string) => Promise<void>;
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
      console.log('Iniciando criação de usuário...', userData);
      
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password || 'tempPassword123',
        options: {
          data: {
            name: userData.name,
            role: userData.role,
          },
          emailRedirectTo: `${window.location.origin}/?confirmation=true`
        }
      });
      
      console.log('Resposta da criação do auth user:', authData);
      
      if (authError) {
        console.error('Erro ao criar auth user:', authError);
        throw new Error(authError.message);
      }
      
      if (!authData.user) {
        throw new Error('Falha ao criar usuário na autenticação');
      }

      console.log('Auth user criado com sucesso:', authData.user);
      
      // Then create the user profile
      const userProfile = {
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        cpf: userData.cpf,
        role: userData.role,
        first_access: true
      };

      console.log('Dados do perfil para criação:', userProfile);
      
      const { data: createdUser, error: profileError } = await supabase
        .from('users')
        .insert(userProfile)
        .select()
        .single();
        
      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        throw new Error(profileError.message);
      }

      if (!createdUser) {
        throw new Error('Erro ao criar perfil: nenhum dado retornado');
      }

      console.log('Usuário criado com sucesso:', createdUser);
      
      set(state => ({ 
        users: [...state.users, createdUser],
        isLoading: false 
      }));
    } catch (error) {
      console.error('Erro completo:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao criar usuário',
        isLoading: false 
      });
      throw error;
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
      console.log('Iniciando exclusão do usuário:', id);

      // Delete user from our custom table first
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
        
      if (profileError) {
        console.error('Erro ao excluir perfil:', profileError);
        throw new Error(profileError.message);
      }

      console.log('Perfil excluído com sucesso');
      
      // Delete user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      
      if (authError) {
        console.error('Erro ao excluir auth user:', authError);
        throw new Error(authError.message);
      }

      console.log('Auth user excluído com sucesso');
      
      set(state => ({
        users: state.users.filter(user => user.id !== id),
        currentUser: state.currentUser?.id === id ? null : state.currentUser,
        isLoading: false
      }));

      console.log('Usuário excluído com sucesso do estado local');
    } catch (error) {
      console.error('Erro completo:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao excluir usuário',
        isLoading: false 
      });
      throw error;
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
  
  assignSurveyToUser: async (researcherId: string, surveyId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Validar parâmetros
      if (!researcherId || !surveyId) {
        throw new Error('ID do pesquisador e da pesquisa são obrigatórios');
      }

      console.log('Atribuindo pesquisa:', { researcherId, surveyId });
      
      // Verificar se o pesquisador existe
      const { data: researcher, error: researcherError } = await supabase
        .from('users')
        .select('role')
        .eq('id', researcherId)
        .single();

      if (researcherError || !researcher) {
        console.error('Erro ao verificar pesquisador:', researcherError);
        throw new Error('Pesquisador não encontrado');
      }

      if (researcher.role !== 'researcher') {
        throw new Error('Usuário não é um pesquisador');
      }

      // Verificar se a pesquisa existe
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .select('id')
        .eq('id', surveyId)
        .single();

      if (surveyError || !survey) {
        console.error('Erro ao verificar pesquisa:', surveyError);
        throw new Error('Pesquisa não encontrada');
      }
      
      // Verificar se já existe uma atribuição
      const { data: existingAssignment, error: existingError } = await supabase
        .from('survey_assignments')
        .select('*')
        .eq('researcher_id', researcherId)
        .eq('survey_id', surveyId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Erro ao verificar atribuição existente:', existingError);
        throw existingError;
      }

      if (existingAssignment) {
        console.log('Atribuição já existe');
        set({ isLoading: false });
        return;
      }

      // Criar nova atribuição
      const { data, error } = await supabase
        .from('survey_assignments')
        .insert({
          researcher_id: researcherId,
          survey_id: surveyId,
          status: 'pending',
          assigned_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar atribuição:', error);
        throw error;
      }

      console.log('Atribuição criada com sucesso:', data);
      set({ isLoading: false });
    } catch (err) {
      console.error('Erro ao atribuir pesquisa:', err);
      set({ 
        error: err instanceof Error ? err.message : 'Erro ao atribuir pesquisa ao usuário', 
        isLoading: false 
      });
      throw err;
    }
  },
}));