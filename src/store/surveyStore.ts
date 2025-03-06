import { create } from 'zustand';
import { Survey, Question, CreateSurveyDTO } from '../types';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface SurveyState {
  surveys: Survey[];
  currentSurvey: Survey | null;
  isLoading: boolean;
  error: string | null;
  fetchSurveys: () => Promise<void>;
  createSurvey: (data: CreateSurveyDTO) => Promise<void>;
  updateSurvey: (id: string, data: Partial<CreateSurveyDTO>) => Promise<void>;
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
  
  createSurvey: async (data) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Iniciando criação de pesquisa...', data);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não está autenticado');
      }

      console.log('Usuário autenticado:', session.user.email);
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('email', session.user.email)
        .single();

      console.log('Perfil do usuário:', user);
      if (!user || user.role !== 'admin') {
        throw new Error('Você não tem permissão para criar pesquisas');
      }

      const code = generateSurveyCode(data.city, data.state);
      console.log('Código gerado:', code);
      
      const surveyData = {
        name: data.name,
        city: data.city,
        state: data.state,
        date: data.date,
        contractor: data.contractor,
        current_manager: {
          type: data.current_manager.type,
          name: data.current_manager.name
        },
        code,
        questions: []
      };

      console.log('Dados formatados para envio:', surveyData);

      const { data: createdSurvey, error: insertError } = await supabase
        .from('surveys')
        .insert(surveyData)
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao inserir pesquisa:', insertError);
        throw new Error(insertError.message);
      }

      if (!createdSurvey) {
        throw new Error('Erro ao criar pesquisa: nenhum dado retornado');
      }

      console.log('Pesquisa criada com sucesso:', createdSurvey);

      set(state => ({
        surveys: [createdSurvey, ...state.surveys],
        currentSurvey: createdSurvey,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Erro completo:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao criar pesquisa',
        isLoading: false,
      });
      throw error;
    }
  },
  
  updateSurvey: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('surveys')
        .update({
          ...data,
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
            ? { ...survey, ...data, updated_at: new Date().toISOString() } 
            : survey
        ),
        currentSurvey: state.currentSurvey?.id === id 
          ? { ...state.currentSurvey, ...data, updated_at: new Date().toISOString() } 
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