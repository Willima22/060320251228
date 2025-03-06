import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash } from 'lucide-react';
import { useSurveyStore } from '../../store/surveyStore';
import { Question } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';

const SurveyQuestionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSurvey, currentSurvey, addQuestion, updateQuestion, deleteQuestion } = useSurveyStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  
  // Form state
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'text' | 'multiple_choice'>('text');
  const [options, setOptions] = useState<string[]>(['']);
  const [isRequired, setIsRequired] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/surveys');
      return;
    }

    const loadSurvey = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await getSurvey(id);
      } catch (err) {
        setError('Erro ao carregar pesquisa.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSurvey();
  }, [id, getSurvey, navigate]);

  const resetForm = () => {
    setQuestionText('');
    setQuestionType('text');
    setOptions(['']);
    setIsRequired(true);
    setCurrentQuestionId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (question: Question) => {
    setQuestionText(question.text);
    setQuestionType(question.type);
    setOptions(question.options || ['']);
    setIsRequired(question.required);
    setCurrentQuestionId(question.id);
    setIsModalOpen(true);
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 1) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !questionText.trim()) return;
    
    const questionData = {
      text: questionText,
      type: questionType,
      options: questionType === 'multiple_choice' ? options.filter(opt => opt.trim()) : undefined,
      required: isRequired,
    };
    
    try {
      if (currentQuestionId) {
        await updateQuestion(id, currentQuestionId, questionData);
      } else {
        await addQuestion(id, questionData);
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setError('Erro ao salvar pergunta.');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!id) return;
    
    try {
      await deleteQuestion(id, questionId);
    } catch (err) {
      setError('Erro ao excluir pergunta.');
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Perguntas da Pesquisa</h1>
          <p className="text-gray-600">{currentSurvey.name}</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Pergunta
        </Button>
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {currentSurvey.questions && currentSurvey.questions.length > 0 ? (
        <div className="space-y-4">
          {currentSurvey.questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">
                        {index + 1}
                      </span>
                      <h3 className="text-lg font-medium">{question.text}</h3>
                      {question.required && (
                        <span className="ml-2 text-red-500 text-sm">*</span>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {question.type === 'text' ? 'Texto' : 'Múltipla Escolha'}
                      </span>
                    </div>
                    
                    {question.type === 'multiple_choice' && question.options && (
                      <div className="mt-3 pl-4">
                        <p className="text-sm text-gray-600 mb-1">Opções:</p>
                        <ul className="list-disc pl-5 text-sm">
                          {question.options.map((option, optIndex) => (
                            <li key={optIndex}>{option}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(question)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 mb-4">Nenhuma pergunta cadastrada para esta pesquisa.</p>
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Pergunta
          </Button>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentQuestionId ? "Editar Pergunta" : "Nova Pergunta"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Texto da Pergunta"
            placeholder="Digite a pergunta"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de Resposta"
              options={[
                { value: 'text', label: 'Texto' },
                { value: 'multiple_choice', label: 'Múltipla Escolha' },
              ]}
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as 'text' | 'multiple_choice')}
            />
            
            <div className="flex items-center space-x-2 mt-8">
              <input
                type="checkbox"
                id="required"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="required" className="text-sm font-medium text-gray-700">
                Resposta obrigatória
              </label>
            </div>
          </div>
          
          {questionType === 'multiple_choice' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Opções de Resposta
              </label>
              
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder={`Opção ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                    disabled={options.length <= 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Opção
              </Button>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {currentQuestionId ? 'Atualizar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SurveyQuestionsPage;