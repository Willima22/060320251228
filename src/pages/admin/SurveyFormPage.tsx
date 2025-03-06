import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSurveyStore } from '../../store/surveyStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import { Card, CardContent, CardHeader, CardFooter } from '../../components/ui/Card';

interface SurveyFormData {
  name: string;
  city: string;
  state: string;
  date: string;
  contractor: string;
  currentManager: {
    type: 'Prefeito' | 'Prefeita' | 'Governador' | 'Governadora' | 'Presidente' | 'Presidenta';
    name: string;
  };
}

const SurveyFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createSurvey, updateSurvey, getSurvey, currentSurvey } = useSurveyStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = Boolean(id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SurveyFormData>({
    defaultValues: {
      currentManager: {
        type: 'Prefeito',
        name: '',
      },
    },
  });

  const managerType = watch('currentManager.type');

  useEffect(() => {
    if (isEditMode && id) {
      const loadSurvey = async () => {
        setIsLoading(true);
        try {
          await getSurvey(id);
        } catch (err) {
          setError('Erro ao carregar dados da pesquisa.');
        } finally {
          setIsLoading(false);
        }
      };

      loadSurvey();
    }
  }, [isEditMode, id, getSurvey]);

  useEffect(() => {
    if (currentSurvey && isEditMode) {
      reset({
        name: currentSurvey.name,
        city: currentSurvey.city,
        state: currentSurvey.state,
        date: currentSurvey.date.split('T')[0], // Format date for input
        contractor: currentSurvey.contractor,
        currentManager: currentSurvey.currentManager,
      });
    }
  }, [currentSurvey, reset, isEditMode]);

  const onSubmit = async (data: SurveyFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isEditMode && id) {
        await updateSurvey(id, data);
      } else {
        await createSurvey(data);
      }
      navigate('/surveys');
    } catch (err) {
      setError('Erro ao salvar pesquisa.');
    } finally {
      setIsLoading(false);
    }
  };

  const managerOptions = [
    { value: 'Prefeito', label: 'Prefeito' },
    { value: 'Prefeita', label: 'Prefeita' },
    { value: 'Governador', label: 'Governador' },
    { value: 'Governadora', label: 'Governadora' },
    { value: 'Presidente', label: 'Presidente' },
    { value: 'Presidenta', label: 'Presidenta' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? 'Editar Pesquisa' : 'Nova Pesquisa'}
      </h1>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {isLoading && !isEditMode ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              {isEditMode ? 'Informações da Pesquisa' : 'Detalhes da Nova Pesquisa'}
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Nome da Pesquisa"
                placeholder="Digite o nome da pesquisa"
                error={errors.name?.message}
                {...register('name', {
                  required: 'Nome da pesquisa é obrigatório',
                })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Cidade"
                  placeholder="Digite a cidade"
                  error={errors.city?.message}
                  {...register('city', {
                    required: 'Cidade é obrigatória',
                  })}
                />

                <Input
                  label="Estado"
                  placeholder="Digite o estado"
                  error={errors.state?.message}
                  {...register('state', {
                    required: 'Estado é obrigatório',
                  })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Data"
                  type="date"
                  error={errors.date?.message}
                  {...register('date', {
                    required: 'Data é obrigatória',
                  })}
                />

                <Input
                  label="Contratante"
                  placeholder="Digite o nome do contratante"
                  error={errors.contractor?.message}
                  {...register('contractor', {
                    required: 'Contratante é obrigatório',
                  })}
                />
              </div>

              {isEditMode && currentSurvey && (
                <div className="bg-gray-100 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    <strong>Código:</strong> {currentSurvey.code}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-md font-medium mb-3">Informações do Gestor Atual</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Tipo de Gestor"
                    options={managerOptions}
                    error={errors.currentManager?.type?.message}
                    {...register('currentManager.type', {
                      required: 'Tipo de gestor é obrigatório',
                    })}
                  />

                  <Input
                    label={`Nome do ${managerType}`}
                    placeholder={`Digite o nome do ${managerType.toLowerCase()}`}
                    error={errors.currentManager?.name?.message}
                    {...register('currentManager.name', {
                      required: 'Nome do gestor é obrigatório',
                    })}
                  />
                </div>
              </div>

              <CardFooter className="px-0 pt-4 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/surveys')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                >
                  {isEditMode ? 'Atualizar Pesquisa' : 'Criar Pesquisa'}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SurveyFormPage;