import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { Card, CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';

interface ProfileFormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProfileFormData>();
  
  const newPassword = watch('newPassword');
  
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
      });
    }
  }, [user, reset]);
  
  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Update profile information
      const { error: profileError } = await supabase
        .from('users')
        .update({
          name: data.name,
        })
        .eq('id', user.id);
        
      if (profileError) {
        throw profileError;
      }
      
      // Update password if requested
      if (isChangingPassword && data.currentPassword && data.newPassword) {
        // First verify current password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: data.currentPassword,
        });
        
        if (signInError) {
          throw new Error('Senha atual incorreta.');
        }
        
        // Then update password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.newPassword,
        });
        
        if (passwordError) {
          throw passwordError;
        }
      }
      
      setSuccess('Perfil atualizado com sucesso!');
      
      // Reset password fields
      reset({
        name: data.name,
        email: user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setIsChangingPassword(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user) {
    return (
      <Alert variant="error">Usuário não encontrado.</Alert>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>
      
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      {success && <Alert variant="success" className="mb-4">{success}</Alert>}
      
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Informações Pessoais</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nome"
              placeholder="Seu nome completo"
              error={errors.name?.message}
              {...register('name', {
                required: 'Nome é obrigatório',
              })}
            />
            
            <Input
              label="E-mail"
              type="email"
              placeholder="Seu e-mail"
              disabled
              {...register('email')}
            />
            
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium">Alterar Senha</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                >
                  {isChangingPassword ? 'Cancelar' : 'Alterar Senha'}
                </Button>
              </div>
              
              {isChangingPassword && (
                <div className="space-y-4">
                  <Input
                    label="Senha Atual"
                    type="password"
                    placeholder="Digite sua senha atual"
                    error={errors.currentPassword?.message}
                    {...register('currentPassword', {
                      required: 'Senha atual é obrigatória',
                    })}
                  />
                  
                  <Input
                    label="Nova Senha"
                    type="password"
                    placeholder="Digite sua nova senha"
                    error={errors.newPassword?.message}
                    {...register('newPassword', {
                      required: 'Nova senha é obrigatória',
                      minLength: {
                        value: 6,
                        message: 'A senha deve ter pelo menos 6 caracteres',
                      },
                    })}
                  />
                  
                  <Input
                    label="Confirmar Nova Senha"
                    type="password"
                    placeholder="Confirme sua nova senha"
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword', {
                      required: 'Confirmação de senha é obrigatória',
                      validate: (value) =>
                        value === newPassword || 'As senhas não coincidem',
                    })}
                  />
                </div>
              )}
            </div>
            
            <CardFooter className="px-0 pt-4 flex justify-end">
              <Button
                type="submit"
                isLoading={isLoading}
              >
                Salvar Alterações
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;