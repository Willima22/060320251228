export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: 'admin' | 'researcher';
  password?: string;
  firstAccess?: boolean;
}

export interface Survey {
  id: string;
  name: string;
  city: string;
  state: string;
  date: string;
  contractor: string;
  code: string;
  currentManager: {
    type: 'Prefeito' | 'Prefeita' | 'Governador' | 'Governadora' | 'Presidente' | 'Presidenta';
    name: string;
  };
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice';
  options?: string[];
  required: boolean;
}

export interface Answer {
  id: string;
  surveyId: string;
  questionId: string;
  researcherId: string;
  answer: string;
  createdAt: string;
}

export interface SurveyAssignment {
  id: string;
  surveyId: string;
  researcherId: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedAt: string;
  completedAt?: string;
}

export interface Report {
  id: string;
  surveyId: string;
  type: 'variable' | 'cross' | 'sample' | 'item';
  parameters: Record<string, any>;
  createdAt: string;
  data: any;
}