import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useUserStore } from '../../store/userStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import { Card, CardContent, CardHeader, CardFooter } from '../../components/ui/Card';

interface UserFormData {
  name: string;
  cpf: string;
  email: string;
  password?: string;
  role: 'admin' | 'researcher';
}

const UserFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createUser, updateUser, getUser, currentUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = Boolean(id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    defaultValues: {
      role: 'researcher',
    },
  });

  useEffect(() => {
    if (isEditMode && id) {
      const loadUser = async () => {
        setIsLoading(true);
        try {
          await getUser(id);
        } catch (err) {
          setError('Erro ao carregar dados do usuário.');
        } finally {
          setIsLoading(false);
        }
      };

      loadUser();
    }
  }, [isEditMode, id, getUser]);

  useEffect(() => {
    if (currentUser && isEditMode) {
      reset({
        name: currentUser.name,
        cpf: currentUser.cpf,
        email: currentUser.email,
        role: currentUser.role,
      });
    }
  }, [currentUser, reset, isEditMode]);

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isEditMode && id) {
        // Remove password if it's empty (not changing password)
        if (!data.password) {
          const { password, ...userData } = data;
          await updateUser(id, userData);
        } else {
          await updateUser(id, data);
        }
      } else {
        await createUser(data);
      }
      navigate('/users');
    } catch (err) {
      setError('Erro ao salvar usuário.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: 'researcher', label: 'Pesquisador' },
    { value: 'admin', label: 'Administrador' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? 'Editar Usuário' : 'Novo Usuário'}
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
              {isEditMode ? 'Informações do Usuário' : 'Detalhes do Novo Usuário'}
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Nome"
                placeholder="Digite o nome completo"
                error={errors.name?.message}
                {...register('name', {
                  required: 'Nome é obrigatório',
                })}
              />

              <Input
                label="CPF"
                placeholder="Digite o CPF"
                error={errors.cpf?.message}
                {...register('cpf', {
                  required: 'CPF é obrigatório',
                  pattern: {
                    value: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
                    message: 'CPF inválido',
                  },
                })}
              />

              <Input
                label="E-mail"
                type="email"
                placeholder="Digite o e-mail"
                error={errors.email?.message}
                {...register('email', {
                  required: 'E-mail é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'E-mail inválido',
                  },
                })}
              />

              <Input
                label={isEditMode ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha'}
                type="password"
                placeholder={isEditMode ? 'Nova senha' : 'Digite a senha'}
                error={errors.password?.message}
                {...register('password', {
                  ...(!isEditMode && { required: 'Senha é obrigatória' }),
                  minLength: {
                    value: 6,
                    message: 'A senha deve ter pelo menos 6 caracteres',
                  },
                })}
              />

              <Select
                label="Função"
                options={roleOptions}
                error={errors.role?.message}
                {...register('role', {
                  required: 'Função é obrigatória',
                })}
              />

              <CardFooter className="px-0 pt-4 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/users')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                >
                  {isEditMode ? 'Atualizar Usuário' : 'Criar Usuário'}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserFormPage;