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
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .order('createdAt', { ascending: false });
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set({ surveys: data as Survey[], isLoading: false });
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
  
  createSurvey: async (survey) => {
    set({ isLoading: true, error: null });
    try {
      // Generate a unique code for the survey
      const code = generateSurveyCode(survey.city, survey.state);
      
      const newSurvey = {
        ...survey,
        id: uuidv4(),
        code,
        questions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
        currentSurvey: newSurvey,
        isLoading: false 
      }));
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
  
  updateSurvey: async (id, surveyData) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('surveys')
        .update({
          ...surveyData,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set(state => ({
        surveys: state.surveys.map(survey => 
          survey.id === id 
            ? { ...survey, ...surveyData, updatedAt: new Date().toISOString() } 
            : survey
        ),
        currentSurvey: state.currentSurvey?.id === id 
          ? { ...state.currentSurvey, ...surveyData, updatedAt: new Date().toISOString() } 
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
          updatedAt: new Date().toISOString(),
        })
        .eq('id', surveyId);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set(state => ({
        currentSurvey: state.currentSurvey 
          ? { ...state.currentSurvey, questions: updatedQuestions, updatedAt: new Date().toISOString() } 
          : null,
        surveys: state.surveys.map(s => 
          s.id === surveyId 
            ? { ...s, questions: updatedQuestions, updatedAt: new Date().toISOString() } 
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
          updatedAt: new Date().toISOString(),
        })
        .eq('id', surveyId);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set(state => ({
        currentSurvey: state.currentSurvey 
          ? { ...state.currentSurvey, questions: updatedQuestions, updatedAt: new Date().toISOString() } 
          : null,
        surveys: state.surveys.map(s => 
          s.id === surveyId 
            ? { ...s, questions: updatedQuestions, updatedAt: new Date().toISOString() } 
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
          updatedAt: new Date().toISOString(),
        })
        .eq('id', surveyId);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set(state => ({
        currentSurvey: state.currentSurvey 
          ? { ...state.currentSurvey, questions: updatedQuestions, updatedAt: new Date().toISOString() } 
          : null,
        surveys: state.surveys.map(s => 
          s.id === surveyId 
            ? { ...s, questions: updatedQuestions, updatedAt: new Date().toISOString() } 
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