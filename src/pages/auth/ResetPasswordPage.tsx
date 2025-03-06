import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ClipboardList } from 'lucide-react';
import { updatePassword } from '../../lib/supabase';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const ResetPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>();

  const password = watch('password');

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await updatePassword(data.password);
      
      if (error) {
        setError(error.message);
      } else {
        navigate('/login', { state: { message: 'Senha alterada com sucesso. Faça login com sua nova senha.' } });
      }
    } catch (err) {
      setError('Ocorreu um erro ao redefinir sua senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-full mb-4">
            <ClipboardList className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema de Pesquisa</h1>
          <p className="text-gray-600 mt-2">Redefinição de senha</p>
        </div>
        
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-center">Criar nova senha</h2>
          </CardHeader>
          <CardContent>
            {error && <Alert variant="error" className="mb-4">{error}</Alert>}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Nova senha"
                type="password"
                placeholder="Digite sua nova senha"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Senha é obrigatória',
                  minLength: {
                    value: 8,
                    message: 'A senha deve ter pelo menos 8 caracteres',
                  },
                })}
              />
              
              <Input
                label="Confirmar senha"
                type="password"
                placeholder="Confirme sua nova senha"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Confirmação de senha é obrigatória',
                  validate: (value) =>
                    value === password || 'As senhas não coincidem',
                })}
              />
              
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Redefinir senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;