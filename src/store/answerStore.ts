import { create } from 'zustand';
import { Answer } from '../types';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface AnswerState {
  answers: Answer[];
  isLoading: boolean;
  error: string | null;
  offlineAnswers: Answer[];
  fetchAnswers: (surveyId: string) => Promise<void>;
  submitAnswer: (answer: Omit<Answer, 'id' | 'createdAt'>) => Promise<void>;
  syncOfflineAnswers: () => Promise<void>;
  addOfflineAnswer: (answer: Omit<Answer, 'id' | 'createdAt'>) => void;
}

// Get initial offline answers from window if available
const initialOfflineAnswers = typeof window !== 'undefined' && window.initialOfflineAnswers 
  ? window.initialOfflineAnswers 
  : [];

export const useAnswerStore = create<AnswerState>((set, get) => ({
  answers: [],
  isLoading: false,
  error: null,
  offlineAnswers: initialOfflineAnswers,
  
  fetchAnswers: async (surveyId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('answers')
        .select('*')
        .eq('surveyId', surveyId);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set({ answers: data as Answer[], isLoading: false });
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
  
  submitAnswer: async (answerData) => {
    set({ isLoading: true, error: null });
    try {
      // Check if online
      if (!navigator.onLine) {
        // Store answer locally for later sync
        get().addOfflineAnswer(answerData);
        set({ isLoading: false });
        return;
      }
      
      const newAnswer = {
        ...answerData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('answers')
        .insert(newAnswer);
        
      if (error) {
        // If error, store locally for later sync
        get().addOfflineAnswer(answerData);
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set(state => ({ 
        answers: [...state.answers, newAnswer],
        isLoading: false 
      }));
    } catch (err) {
      // If exception, store locally for later sync
      get().addOfflineAnswer(answerData);
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
  
  addOfflineAnswer: (answerData) => {
    const newAnswer = {
      ...answerData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    
    set(state => ({
      offlineAnswers: [...state.offlineAnswers, newAnswer]
    }));
    
    // Store in localStorage
    const storedAnswers = JSON.parse(localStorage.getItem('offlineAnswers') || '[]');
    localStorage.setItem('offlineAnswers', JSON.stringify([...storedAnswers, newAnswer]));
  },
  
  syncOfflineAnswers: async () => {
    set({ isLoading: true, error: null });
    
    // Check if online
    if (!navigator.onLine) {
      set({ error: 'No internet connection', isLoading: false });
      return;
    }
    
    try {
      const offlineAnswers = get().offlineAnswers;
      
      if (offlineAnswers.length === 0) {
        set({ isLoading: false });
        return;
      }
      
      // Insert all offline answers
      const { error } = await supabase
        .from('answers')
        .insert(offlineAnswers);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      // Clear offline answers
      localStorage.removeItem('offlineAnswers');
      
      set(state => ({ 
        answers: [...state.answers, ...offlineAnswers],
        offlineAnswers: [],
        isLoading: false 
      }));
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
}));

// Add type declaration for window
declare global {
  interface Window {
    initialOfflineAnswers: Answer[];
  }
}