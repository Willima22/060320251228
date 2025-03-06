import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

const EmailConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const code = searchParams.get('code');
        
        if (!code) {
          setError('Código de confirmação não encontrado.');
          setIsLoading(false);
          return;
        }

        // Verificar se o email foi confirmado
        const { error } = await supabase.auth.verifyOtp({
          token_hash: code,
          type: 'email'
        });

        if (error) {
          setError('Erro ao confirmar email: ' + error.message);
        } else {
          setSuccess(true);
        }
      } catch (err) {
        setError('Erro inesperado ao confirmar email.');
      } finally {
        setIsLoading(false);
      }
    };

    confirmEmail();
  }, [searchParams]);

  const handleContinue = () => {
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center">Confirmação de Email</h2>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}
          
          {success && (
            <>
              <Alert variant="success" className="mb-4">
                Email confirmado com sucesso!
              </Alert>
              <Button onClick={handleContinue} className="w-full">
                Continuar para o Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmationPage; 