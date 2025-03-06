import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSurveyStore } from '../../store/surveyStore';
import { useAnswerStore } from '../../store/answerStore';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { Card, CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';

interface FormValues {
  [key: string]: string;
}

const SurveyFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSurvey, currentSurvey } = useSurveyStore();
  const { submitAnswer } = useAnswerStore();
  const { user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingAnswers, setExistingAnswers] = useState<Record<string, string>>({});
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormValues>();
  
  useEffect(() => {
    if (!id || !user) {
      navigate('/dashboard');
      return;
    }
    
    const loadSurvey = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await getSurvey(id);
        await fetchExistingAnswers();
      } catch (err) {
        setError('Erro ao carregar pesquisa.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSurvey();
  }, [id, getSurvey, navigate, user]);
  
  const fetchExistingAnswers = async () => {
    if (!id || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('answers')
        .select('*')
        .eq('surveyId', id)
        .eq('researcherId', user.id);
        
      if (error) {
        throw error;
      }
      
      const answers: Record<string, string> = {};
      data.forEach(answer => {
        answers[answer.questionId] = answer.answer;
      });
      
      setExistingAnswers(answers);
      
      // Pre-fill form with existing answers
      Object.entries(answers).forEach(([questionId, answer]) => {
        setValue(questionId, answer);
      });
    } catch (err) {
      console.error('Error fetching existing answers:', err);
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    if (!id || !user || !currentSurvey) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Submit each answer
      const promises = Object.entries(data).map(([questionId, answer]) => {
        // Skip empty answers
        if (!answer.trim()) return Promise.resolve();
        
        return submitAnswer({
          surveyId: id,
          questionId,
          researcherId: user.id,
          answer,
        });
      });
      
      await Promise.all(promises);
      
      // Update assignment status
      await supabase
        .from('survey_assignments')
        .update({
          status: 'completed',
          completedAt: new Date().toISOString(),
        })
        .eq('surveyId', id)
        .eq('researcherId', user.id);
      
      setSuccess(true);
      
      // Redirect after a delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError('Erro ao salvar respostas. Verifique sua conexão com a internet.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!currentSurvey) {
    return (
      <Alert variant="error">Pesquisa não encontrada.</Alert>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{currentSurvey.name}</h1>
      <p className="text-gray-600 mb-6">
        {currentSurvey.city}, {currentSurvey.state} - {new Date(currentSurvey.date).toLocaleDateString()}
      </p>
      
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      {success && (
        <Alert variant="success" className="mb-4">
          Respostas salvas com sucesso! Redirecionando...
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Formulário de Pesquisa</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {currentSurvey.questions.map((question, index) => (
              <div key={question.id} className="border-b border-gray-200 pb-4 mb-4 last:border-0">
                <div className="flex items-start mb-2">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2 mt-1">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-medium">
                    {question.text}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                </div>
                
                {question.type === 'text' ? (
                  <Input
                    placeholder="Digite sua resposta"
                    error={errors[question.id]?.message}
                    {...register(question.id, {
                      required: question.required ? 'Esta resposta é obrigatória' : false,
                    })}
                  />
                ) : (
                  <div className="space-y-2">
                    {question.options?.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center">
                        <input
                          type="radio"
                          id={`${question.id}-${optIndex}`}
                          value={option}
                          {...register(question.id, {
                            required: question.required ? 'Esta resposta é obrigatória' : false,
                          })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label
                          htmlFor={`${question.id}-${optIndex}`}
                          className="ml-2 text-sm text-gray-700"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                    {errors[question.id] && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors[question.id]?.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            <CardFooter className="px-0 pt-4 flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
              >
                Finalizar Pesquisa
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SurveyFormPage;