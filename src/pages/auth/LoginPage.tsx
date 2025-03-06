import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ClipboardList } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Card, CardContent, CardHeader, CardFooter } from '../../components/ui/Card';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { signIn } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await signIn(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciais inválidas. Por favor, tente novamente.');
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
          <p className="text-gray-600 mt-2">Faça login para acessar o sistema</p>
        </div>
        
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-center">Login</h2>
          </CardHeader>
          <CardContent>
            {error && <Alert variant="error" className="mb-4">{error}</Alert>}
            
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
              
              <Input
                label="Senha"
                type="password"
                placeholder="Sua senha"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Senha é obrigatória',
                })}
              />
              
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Entrar
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
              Esqueci minha senha
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;