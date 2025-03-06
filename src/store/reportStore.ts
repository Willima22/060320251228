import { create } from 'zustand';
import { Report, Answer } from '../types';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface ReportState {
  reports: Report[];
  currentReport: Report | null;
  isLoading: boolean;
  error: string | null;
  generateVariableReport: (surveyId: string, variable: string) => Promise<Report>;
  generateCrossReport: (surveyId: string, variables: string[]) => Promise<Report>;
  generateSampleReport: (surveyId: string) => Promise<Report>;
  generateItemReport: (surveyId: string) => Promise<Report>;
  fetchReports: (surveyId: string) => Promise<void>;
  exportReport: (reportId: string, format: 'csv' | 'excel') => Promise<string>;
}

export const useReportStore = create<ReportState>((set, get) => ({
  reports: [],
  currentReport: null,
  isLoading: false,
  error: null,
  
  fetchReports: async (surveyId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('surveyId', surveyId)
        .order('createdAt', { ascending: false });
        
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      
      set({ reports: data as Report[], isLoading: false });
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },
  
  generateVariableReport: async (surveyId, variable) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch all answers for this survey
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('surveyId', surveyId);
        
      if (answersError) {
        set({ error: answersError.message, isLoading: false });
        throw new Error(answersError.message);
      }
      
      const answers = answersData as Answer[];
      
      // Process data for the variable report
      const reportData = processVariableReport(answers, variable);
      
      // Create report
      const newReport: Report = {
        id: uuidv4(),
        surveyId,
        type: 'variable',
        parameters: { variable },
        createdAt: new Date().toISOString(),
        data: reportData,
      };
      
      // Save report to database
      const { error } = await supabase
        .from('reports')
        .insert(newReport);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        throw new Error(error.message);
      }
      
      set(state => ({ 
        reports: [newReport, ...state.reports],
        currentReport: newReport,
        isLoading: false 
      }));
      
      return newReport;
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
      throw err;
    }
  },
  
  generateCrossReport: async (surveyId, variables) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch all answers for this survey
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('surveyId', surveyId);
        
      if (answersError) {
        set({ error: answersError.message, isLoading: false });
        throw new Error(answersError.message);
      }
      
      const answers = answersData as Answer[];
      
      // Process data for the cross report
      const reportData = processCrossReport(answers, variables);
      
      // Create report
      const newReport: Report = {
        id: uuidv4(),
        surveyId,
        type: 'cross',
        parameters: { variables },
        createdAt: new Date().toISOString(),
        data: reportData,
      };
      
      // Save report to database
      const { error } = await supabase
        .from('reports')
        .insert(newReport);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        throw new Error(error.message);
      }
      
      set(state => ({ 
        reports: [newReport, ...state.reports],
        currentReport: newReport,
        isLoading: false 
      }));
      
      return newReport;
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
      throw err;
    }
  },
  
  generateSampleReport: async (surveyId) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch all answers for this survey
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('surveyId', surveyId);
        
      if (answersError) {
        set({ error: answersError.message, isLoading: false });
        throw new Error(answersError.message);
      }
      
      const answers = answersData as Answer[];
      
      // Process data for the sample report
      const reportData = processSampleReport(answers);
      
      // Create report
      const newReport: Report = {
        id: uuidv4(),
        surveyId,
        type: 'sample',
        parameters: {},
        createdAt: new Date().toISOString(),
        data: reportData,
      };
      
      // Save report to database
      const { error } = await supabase
        .from('reports')
        .insert(newReport);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        throw new Error(error.message);
      }
      
      set(state => ({ 
        reports: [newReport, ...state.reports],
        currentReport: newReport,
        isLoading: false 
      }));
      
      return newReport;
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
      throw err;
    }
  },
  
  generateItemReport: async (surveyId) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch all answers for this survey
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('surveyId', surveyId);
        
      if (answersError) {
        set({ error: answersError.message, isLoading: false });
        throw new Error(answersError.message);
      }
      
      // Fetch the survey to get questions
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .single();
        
      if (surveyError) {
        set({ error: surveyError.message, isLoading: false });
        throw new Error(surveyError.message);
      }
      
      const answers = answersData as Answer[];
      
      // Process data for the item report
      const reportData = processItemReport(answers, surveyData.questions);
      
      // Create report
      const newReport: Report = {
        id: uuidv4(),
        surveyId,
        type: 'item',
        parameters: {},
        createdAt: new Date().toISOString(),
        data: reportData,
      };
      
      // Save report to database
      const { error } = await supabase
        .from('reports')
        .insert(newReport);
        
      if (error) {
        set({ error: error.message, isLoading: false });
        throw new Error(error.message);
      }
      
      set(state => ({ 
        reports: [newReport, ...state.reports],
        currentReport: newReport,
        isLoading: false 
      }));
      
      return newReport;
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
      throw err;
    }
  },
  
  exportReport: async (reportId, format) => {
    set({ isLoading: true, error: null });
    try {
      const report = get().reports.find(r => r.id === reportId);
      
      if (!report) {
        set({ error: 'Report not found', isLoading: false });
        throw new Error('Report not found');
      }
      
      // Convert report data to the requested format
      let exportData = '';
      
      if (format === 'csv') {
        exportData = convertToCSV(report.data);
      } else {
        // For simplicity, we'll just use CSV for now
        exportData = convertToCSV(report.data);
      }
      
      set({ isLoading: false });
      
      return exportData;
    } catch (err) {
      set({ error: 'An unexpected error occurred', isLoading: false });
      throw err;
    }
  },
}));

// Helper functions for report processing
function processVariableReport(answers: Answer[], variable: string) {
  // Group answers by the variable
  const grouped: Record<string, number> = {};
  
  answers.forEach(answer => {
    if (answer.questionId === variable) {
      grouped[answer.answer] = (grouped[answer.answer] || 0) + 1;
    }
  });
  
  // Calculate percentages
  const total = Object.values(grouped).reduce((sum, count) => sum + count, 0);
  
  const result = Object.entries(grouped).map(([value, count]) => ({
    value,
    count,
    percentage: (count / total) * 100
  }));
  
  return result;
}

function processCrossReport(answers: Answer[], variables: string[]) {
  // Group answers by the first variable
  const grouped: Record<string, Record<string, number>> = {};
  
  // Get unique answers for each variable
  const uniqueValues: Record<string, Set<string>> = {};
  variables.forEach(variable => {
    uniqueValues[variable] = new Set();
  });
  
  // Organize answers by researcher
  const answersByResearcher: Record<string, Record<string, string>> = {};
  
  answers.forEach(answer => {
    if (!answersByResearcher[answer.researcherId]) {
      answersByResearcher[answer.researcherId] = {};
    }
    
    if (variables.includes(answer.questionId)) {
      answersByResearcher[answer.researcherId][answer.questionId] = answer.answer;
      uniqueValues[answer.questionId].add(answer.answer);
    }
  });
  
  // Cross-tabulate the variables
  Object.values(answersByResearcher).forEach(researcherAnswers => {
    const var1 = researcherAnswers[variables[0]];
    const var2 = researcherAnswers[variables[1]];
    
    if (var1 && var2) {
      if (!grouped[var1]) {
        grouped[var1] = {};
      }
      
      grouped[var1][var2] = (grouped[var1][var2] || 0) + 1;
    }
  });
  
  // Calculate percentages
  const result = Object.entries(grouped).map(([var1Value, var2Values]) => {
    const total = Object.values(var2Values).reduce((sum, count) => sum + count, 0);
    
    const detailedValues = Object.entries(var2Values).map(([var2Value, count]) => ({
      value: var2Value,
      count,
      percentage: (count / total) * 100
    }));
    
    return {
      value: var1Value,
      total,
      details: detailedValues
    };
  });
  
  return result;
}

function processSampleReport(answers: Answer[]) {
  // Group answers by question
  const grouped: Record<string, Record<string, number>> = {};
  
  answers.forEach(answer => {
    if (!grouped[answer.questionId]) {
      grouped[answer.questionId] = {};
    }
    
    grouped[answer.questionId][answer.answer] = (grouped[answer.questionId][answer.answer] || 0) + 1;
  });
  
  // Calculate percentages for each question
  const result = Object.entries(grouped).map(([questionId, answerCounts]) => {
    const total = Object.values(answerCounts).reduce((sum, count) => sum + count, 0);
    
    const detailedValues = Object.entries(answerCounts).map(([answerValue, count]) => ({
      value: answerValue,
      count,
      percentage: (count / total) * 100
    }));
    
    return {
      questionId,
      total,
      details: detailedValues
    };
  });
  
  return result;
}

function processItemReport(answers: Answer[], questions: any[]) {
  // Organize all answers by question and researcher
  const result = questions.map(question => {
    const questionAnswers = answers.filter(a => a.questionId === question.id);
    
    return {
      questionId: question.id,
      questionText: question.text,
      answers: questionAnswers.map(a => ({
        researcherId: a.researcherId,
        answer: a.answer,
        createdAt: a.createdAt
      }))
    };
  });
  
  return result;
}

function convertToCSV(data: any) {
  // Simple CSV conversion
  if (!data || !data.length) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map((row: any) => {
    return Object.values(row).map(value => {
      // Handle nested objects
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      // Handle strings with commas
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(',');
  }).join('\n');
  
  return `${headers}\n${rows}`;
}