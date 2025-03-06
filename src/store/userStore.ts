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
  clearError: () => void;
}

// Interface para melhorar a tipagem das atribuições
interface SurveyAssignment {
  researcher_id: string;
  survey_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_at: string;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
  
  clearError: () => set({ error: null }),
  
  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      set({ users: data as User[], isLoading: false });
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      set({ 
        error: err instanceof Error ? err.message : 'Erro ao buscar usuários',
        isLoading: false 
      });
    }
  },
  
  createUser: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Iniciando criação de usuário...', userData);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password || 'tempPassword123',
        options: {
          data: {
            name: userData.name,
            role: userData.role,
          },
          emailRedirectTo: `${window.location.origin}/confirm-email`
        }
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário na autenticação');

      console.log('Auth user criado com sucesso:', authData.user);
      
      const userProfile = {
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        cpf: userData.cpf,
        role: userData.role,
        first_access: true
      };
      
      const { data: createdUser, error: profileError } = await supabase
        .from('users')
        .insert(userProfile)
        .select()
        .single();
        
      if (profileError) throw profileError;
      if (!createdUser) throw new Error('Erro ao criar perfil: nenhum dado retornado');

      console.log('Usuário criado com sucesso:', createdUser);
      
      set(state => ({ 
        users: [...state.users, createdUser],
        isLoading: false 
      }));
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
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
        
      if (error) throw error;
      
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
      console.error('Erro ao atualizar usuário:', err);
      set({ 
        error: err instanceof Error ? err.message : 'Erro ao atualizar usuário',
        isLoading: false 
      });
      throw err;
    }
  },
  
  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Primeiro remove as atribuições de pesquisa
      const { error: assignmentsError } = await supabase
        .from('survey_assignments')
        .delete()
        .eq('researcher_id', id);
        
      if (assignmentsError) throw assignmentsError;

      // Remove o perfil do usuário
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
        
      if (profileError) throw profileError;
      
      // Remove o usuário da autenticação
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      if (authError) throw authError;
      
      set(state => ({
        users: state.users.filter(user => user.id !== id),
        currentUser: state.currentUser?.id === id ? null : state.currentUser,
        isLoading: false
      }));

      console.log('Usuário excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
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
        
      if (error) throw error;
      
      set({ currentUser: data as User, isLoading: false });
    } catch (err) {
      console.error('Erro ao buscar usuário:', err);
      set({ 
        error: err instanceof Error ? err.message : 'Erro ao buscar usuário',
        isLoading: false 
      });
      throw err;
    }
  },
  
  assignSurveyToUser: async (researcherId: string, surveyId: string) => {
    set({ isLoading: true, error: null });
    try {
      if (!researcherId || !surveyId) {
        throw new Error('ID do pesquisador e da pesquisa são obrigatórios');
      }

      console.log('Iniciando processo de atribuição:', {
        researcherId,
        surveyId,
        timestamp: new Date().toISOString()
      });

      // Verificar se o pesquisador existe e é um pesquisador
      const { data: researcher, error: researcherError } = await supabase
        .from('users')
        .select('id, role, name')
        .eq('id', researcherId)
        .single();

      if (researcherError) {
        console.error('Erro ao verificar pesquisador:', researcherError);
        throw researcherError;
      }
      if (!researcher) {
        throw new Error('Pesquisador não encontrado');
      }
      if (researcher.role !== 'researcher') {
        throw new Error('Usuário não é um pesquisador');
      }

      console.log('Pesquisador verificado:', researcher);

      // Verificar se a pesquisa existe
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .select('id, name')
        .eq('id', surveyId)
        .single();

      if (surveyError) {
        console.error('Erro ao verificar pesquisa:', surveyError);
        throw surveyError;
      }
      if (!survey) {
        throw new Error('Pesquisa não encontrada');
      }

      console.log('Pesquisa verificada:', survey);
      
      // Verificar se já existe uma atribuição
      const { data: existingAssignment, error: existingError } = await supabase
        .from('survey_assignments')
        .select('*')
        .eq('researcher_id', researcherId)
        .eq('survey_id', surveyId)
        .maybeSingle();

      if (existingError) {
        console.error('Erro ao verificar atribuição existente:', existingError);
        throw existingError;
      }

      if (existingAssignment) {
        console.log('Atribuição já existe:', existingAssignment);
        return existingAssignment;
      }

      // Criar nova atribuição
      const newAssignment = {
        id: crypto.randomUUID(), // Garante um ID único
        researcher_id: researcherId,
        survey_id: surveyId,
        status: 'pending',
        assigned_at: new Date().toISOString()
      };

      console.log('Tentando criar nova atribuição:', newAssignment);

      const { data: createdAssignment, error: insertError } = await supabase
        .from('survey_assignments')
        .insert([newAssignment])
        .select('*, survey:surveys(*)')
        .single();

      if (insertError) {
        console.error('Erro ao criar atribuição:', insertError);
        throw insertError;
      }

      if (!createdAssignment) {
        throw new Error('Erro ao criar atribuição: nenhum dado retornado');
      }

      console.log('Atribuição criada com sucesso:', {
        researcher: researcher.name,
        survey: survey.name,
        assignment: createdAssignment
      });

      // Atualiza o estado local se necessário
      const state = get();
      if (state.currentUser?.id === researcherId) {
        set(state => ({
          ...state,
          assignments: [...(state.assignments || []), createdAssignment]
        }));
      }
      
      set({ isLoading: false });
      return createdAssignment;
    } catch (err) {
      console.error('Erro detalhado ao atribuir pesquisa:', err);
      set({ 
        error: err instanceof Error ? err.message : 'Erro ao atribuir pesquisa ao usuário',
        isLoading: false 
      });
      throw err;
    }
  },
}));