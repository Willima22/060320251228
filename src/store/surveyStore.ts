import { create } from 'zustand';
import { Survey, Question } from '../types';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface SurveyState {
  surveys: Survey[];
  currentSurvey: Survey | null;
  isLoading: boolean;
  error: string | null;
  fetchSurveys: () => Promise<void>;
  createSurvey: (survey: Omit<Survey, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSurvey: (id: string, survey: Partial<Survey>) => Promise<void>;
  deleteSurvey: (id: string) => Promise<void>;
  duplicateSurvey: (id: string) => Promise<void>;
  getSurvey: (id: string) => Promise<void>;
  addQuestion: (surveyId: string, question: Omit<Question, 'id'>) => Promise<void>;
  updateQuestion: (surveyId: string, questionId: string, question: Partial<Question>) => Promise<void>;
  deleteQuestion: (surveyId: string, questionId: string) => Promise<void>;
}

export const useSurveyStore = create<SurveyState>((set, get) => ({
  surveys: [],
  currentSurvey: null,
  isLoading: false,
  error: null,
  
  fetchSurveys: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('Iniciando busca de pesquisas...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError);
        set({ error: 'Erro ao verificar autenticação', isLoading: false });
        return;
      }
      
      if (!session) {
        console.error('Usuário não está autenticado');
        set({ error: 'Usuário não está autenticado', isLoading: false });
        return;
      }

      console.log('Usuário autenticado:', session.user.email);
      
      // Verificar se o usuário existe na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();
        
      if (userError) {
        console.error('Erro ao buscar perfil do usuário:', userError);
        set({ error: 'Erro ao buscar perfil do usuário', isLoading: false });
        return;
      }
      
      if (!userData) {
        console.error('Usuário não encontrado na tabela users');
        set({ error: 'Usuário não encontrado', isLoading: false });
        return;
      }

      console.log('Perfil do usuário:', userData);
      console.log('Iniciando busca de pesquisas...');
      
      // Buscar pesquisas com base no papel do usuário
      let query = supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });

      // Se for pesquisador, buscar apenas pesquisas atribuídas
      if (userData.role === 'researcher') {
        const { data: assignments, error: assignmentError } = await supabase
          .from('survey_assignments')
          .select('surveyId')
          .eq('researcherId', userData.id);

        if (assignmentError) {
          console.error('Erro ao buscar atribuições:', assignmentError);
          set({ error: 'Erro ao buscar atribuições de pesquisa', isLoading: false });
          return;
        }

        const surveyIds = assignments.map(a => a.surveyId);
        query = query.in('id', surveyIds);
      }
      
      const { data, error, status } = await query;
        
      if (error) {
        console.error('Erro ao buscar pesquisas:', error);
        console.error('Status da resposta:', status);
        set({ error: `Erro ao buscar pesquisas: ${error.message} (Status: ${status})`, isLoading: false });
        return;
      }
      
      if (!data) {
        console.warn('Nenhuma pesquisa encontrada');
        set({ surveys: [], isLoading: false });
        return;
      }

      console.log('Pesquisas encontradas:', data.length);
      console.log('Dados das pesquisas:', data);
      set({ surveys: data as Survey[], isLoading: false });
    } catch (err) {
      console.error('Erro inesperado ao buscar pesquisas:', err);
      set({ error: 'Ocorreu um erro inesperado ao buscar as pesquisas', isLoading: false });
    }
  },
  
  createSurvey: async (survey) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Iniciando criação de pesquisa...', survey);
      
      // Verificar autenticação
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError);
        set({ error: 'Erro ao verificar autenticação', isLoading: false });
        return;
      }
      
      if (!session) {
        console.error('Usuário não está autenticado');
        set({ error: 'Usuário não está autenticado', isLoading: false });
        return;
      }

      console.log('Usuário autenticado:', session.user.email);
      
      // Verificar se o usuário existe na tabela users e é admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();
        
      if (userError) {
        console.error('Erro ao buscar perfil do usuário:', userError);
        set({ error: 'Erro ao buscar perfil do usuário', isLoading: false });
        return;
      }
      
      if (!userData) {
        console.error('Usuário não encontrado na tabela users');
        set({ error: 'Usuário não encontrado', isLoading: false });
        return;
      }

      console.log('Perfil do usuário:', userData);

      if (userData.role !== 'admin') {
        console.error('Usuário não tem permissão para criar pesquisas');
        set({ error: 'Você não tem permissão para criar pesquisas', isLoading: false });
        return;
      }

      console.log('Gerando código da pesquisa...');
      const code = generateSurveyCode(survey.city, survey.state);
      
      // Garantir que currentManager seja um objeto válido
      const currentManager = typeof survey.currentManager === 'string' 
        ? JSON.parse(survey.currentManager)
        : survey.currentManager;
      
      const newSurvey = {
        ...survey,
        id: uuidv4(),
        code,
        current_manager: currentManager,
        questions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      console.log('Tentando criar pesquisa:', newSurvey);
      
      const { data, error, status } = await supabase
        .from('surveys')
        .insert([newSurvey])
        .select()
        .single();
        
      if (error) {
        console.error('Erro ao criar pesquisa:', error);
        console.error('Status da resposta:', status);
        set({ error: `Erro ao criar pesquisa: ${error.message} (Status: ${status})`, isLoading: false });
        return;
      }
      
      if (!data) {
        console.error('Pesquisa criada mas não retornou dados');
        set({ error: 'Erro ao criar pesquisa: dados não retornados', isLoading: false });
        return;
      }
      
      console.log('Pesquisa criada com sucesso:', data);
      set(state => ({ 
        surveys: [data, ...state.surveys],
        currentSurvey: data,
        isLoading: false 
      }));
    } catch (err) {
      console.error('Erro inesperado ao criar pesquisa:', err);
      set({ error: 'Ocorreu um erro inesperado ao criar a pesquisa', isLoading: false });
    }
  },
  
  updateSurvey: async (id, surveyData) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('surveys')
        .update({
          ...surveyData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set(state => ({
        surveys: state.surveys.map(survey => 
          survey.id === id 
            ? { ...survey, ...surveyData, updated_at: new Date().toISOString() } 
            : survey
        ),
        currentSurvey: state.currentSurvey?.id === id 
          ? { ...state.currentSurvey, ...surveyData, updated_at: new Date().toISOString() } 
          : state.currentSurvey,
        isLoading: false
      }));
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
  
  deleteSurvey: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', id);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set(state => ({
        surveys: state.surveys.filter(survey => survey.id !== id),
        currentSurvey: state.currentSurvey?.id === id ? null : state.currentSurvey,
        isLoading: false
      }));
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
  
  duplicateSurvey: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const surveyToDuplicate = get().surveys.find(survey => survey.id === id);
      
      if (!surveyToDuplicate) {
        set({ error: 'Survey not found', isLoading: false });
        return;
      }
      
      const newSurvey = {
        ...surveyToDuplicate,
        id: uuidv4(),
        name: `${surveyToDuplicate.name} (Copy)`,
        code: generateSurveyCode(surveyToDuplicate.city, surveyToDuplicate.state),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('surveys')
        .insert(newSurvey);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set(state => ({ 
        surveys: [newSurvey, ...state.surveys],
        isLoading: false 
      }));
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
  
  getSurvey: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set({ currentSurvey: data as Survey, isLoading: false });
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
  
  addQuestion: async (surveyId, question) => {
    set({ isLoading: true, error: null });
    try {
      const survey = get().currentSurvey;
      
      if (!survey) {
        set({ error: 'No survey selected', isLoading: false });
        return;
      }
      
      const newQuestion = {
        ...question,
        id: uuidv4(),
      };
      
      const updatedQuestions = [...(survey.questions || []), newQuestion];
      
      const { error } = await supabase
        .from('surveys')
        .update({
          questions: updatedQuestions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', surveyId);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set(state => ({
        currentSurvey: state.currentSurvey 
          ? { ...state.currentSurvey, questions: updatedQuestions, updated_at: new Date().toISOString() } 
          : null,
        surveys: state.surveys.map(s => 
          s.id === surveyId 
            ? { ...s, questions: updatedQuestions, updated_at: new Date().toISOString() } 
            : s
        ),
        isLoading: false
      }));
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
  
  updateQuestion: async (surveyId, questionId, questionData) => {
    set({ isLoading: true, error: null });
    try {
      const survey = get().currentSurvey;
      
      if (!survey) {
        set({ error: 'No survey selected', isLoading: false });
        return;
      }
      
      const updatedQuestions = survey.questions.map(q => 
        q.id === questionId ? { ...q, ...questionData } : q
      );
      
      const { error } = await supabase
        .from('surveys')
        .update({
          questions: updatedQuestions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', surveyId);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set(state => ({
        currentSurvey: state.currentSurvey 
          ? { ...state.currentSurvey, questions: updatedQuestions, updated_at: new Date().toISOString() } 
          : null,
        surveys: state.surveys.map(s => 
          s.id === surveyId 
            ? { ...s, questions: updatedQuestions, updated_at: new Date().toISOString() } 
            : s
        ),
        isLoading: false
      }));
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
  
  deleteQuestion: async (surveyId, questionId) => {
    set({ isLoading: true, error: null });
    try {
      const survey = get().currentSurvey;
      
      if (!survey) {
        set({ error: 'No survey selected', isLoading: false });
        return;
      }
      
      const updatedQuestions = survey.questions.filter(q => q.id !== questionId);
      
      const { error } = await supabase
        .from('surveys')
        .update({
          questions: updatedQuestions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', surveyId);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set(state => ({
        currentSurvey: state.currentSurvey 
          ? { ...state.currentSurvey, questions: updatedQuestions, updated_at: new Date().toISOString() } 
          : null,
        surveys: state.surveys.map(s => 
          s.id === surveyId 
            ? { ...s, questions: updatedQuestions, updated_at: new Date().toISOString() } 
            : s
        ),
        isLoading: false
      }));
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
}));

// Helper function to generate a unique survey code
function generateSurveyCode(city: string, state: string): string {
  const cityCode = city.substring(0, 3).toUpperCase();
  const stateCode = state.substring(0, 2).toUpperCase();
  const timestamp = Date.now().toString().substring(7);
  return `${cityCode}${stateCode}${timestamp}`;
}