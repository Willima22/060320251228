import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ClipboardList } from 'lucide-react';
import { resetPassword } from '../../lib/supabase';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Card, CardContent, CardHeader, CardFooter } from '../../components/ui/Card';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await resetPassword(data.email);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Ocorreu um erro ao processar sua solicitação.');
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
          <p className="text-gray-600 mt-2">Recuperação de senha</p>
        </div>
        
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-center">Esqueci minha senha</h2>
          </CardHeader>
          <CardContent>
            {error && <Alert variant="error" className="mb-4">{error}</Alert>}
            
            {success ? (
              <Alert variant="success">
                Enviamos um e-mail com instruções para redefinir sua senha. Por favor, verifique sua caixa de entrada.
              </Alert>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="Seu e-mail"
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'E-mail é obrigatório',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'E-mail inválido',
                    },
                  })}
                />
                
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                >
                  Enviar link de recuperação
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800">
              Voltar para o login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;