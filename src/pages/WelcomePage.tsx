import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import { ClipboardList } from 'lucide-react';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'admin',
          }
        }
      });
      
      if (authError) {
        throw new Error(authError.message);
      }
      
      if (!authData.user) {
        throw new Error('Falha ao criar usuário');
      }
      
      // 2. Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name,
          email,
          cpf,
          role: 'admin',
          first_access: false
        });
        
      if (profileError) {
        throw new Error(profileError.message);
      }
      
      setSuccess('Usuário administrador criado com sucesso! Você pode fazer login agora.');
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao criar usuário administrador');
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
          <p className="text-gray-600 mt-2">Bem-vindo ao sistema</p>
        </div>
        
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-center">Configuração Inicial</h2>
          </CardHeader>
          <CardContent>
            {error && <Alert variant="error" className="mb-4">{error}</Alert>}
            {success && <Alert variant="success" className="mb-4">{success}</Alert>}
            
            {!isCreatingAdmin ? (
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Para começar a usar o sistema, você precisa criar um usuário administrador.
                </p>
                <Button onClick={() => setIsCreatingAdmin(true)}>
                  Criar Administrador
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <Input
                  label="Nome"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                
                <Input
                  label="CPF"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  required
                />
                
                <Input
                  label="Senha"
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreatingAdmin(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                  >
                    Criar Administrador
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WelcomePage;