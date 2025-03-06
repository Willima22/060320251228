import React, { useEffect, useState } from 'react';
import { useAnswerStore } from '../../store/answerStore';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Wifi, WifiOff, RefreshCw, Check } from 'lucide-react';

const SyncPage: React.FC = () => {
  const { offlineAnswers, syncOfflineAnswers } = useAnswerStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(
    localStorage.getItem('lastSyncTime')
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      setError('Você está offline. Conecte-se à internet para sincronizar.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await syncOfflineAnswers();
      const now = new Date().toLocaleString();
      setLastSyncTime(now);
      localStorage.setItem('lastSyncTime', now);
      setSuccess('Sincronização concluída com sucesso!');
    } catch (err) {
      setError('Erro ao sincronizar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sincronização de Dados</h1>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      {success && <Alert variant="success" className="mb-4">{success}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500 mr-2" />
              )}
              <h2 className="text-lg font-semibold">Status da Conexão</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Status:</p>
                <p className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
                {isOnline ? (
                  <Wifi className="h-6 w-6 text-green-500" />
                ) : (
                  <WifiOff className="h-6 w-6 text-red-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Dados Pendentes</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Respostas não sincronizadas:</p>
                <p className="text-2xl font-bold">{offlineAnswers.length}</p>
              </div>
              <div className={`p-3 rounded-full ${offlineAnswers.length > 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                {offlineAnswers.length > 0 ? (
                  <RefreshCw className="h-6 w-6 text-yellow-500" />
                ) : (
                  <Check className="h-6 w-6 text-green-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-lg font-semibold">Sincronização Manual</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lastSyncTime && (
              <p className="text-sm text-gray-600">
                Última sincronização: {lastSyncTime}
              </p>
            )}
            
            <Button
              onClick={handleSync}
              isLoading={isLoading}
              disabled={!isOnline || offlineAnswers.length === 0}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar Agora
            </Button>
            
            {!isOnline && (
              <p className="text-sm text-red-500">
                Você está offline. Conecte-se à internet para sincronizar.
              </p>
            )}
            
            {isOnline && offlineAnswers.length === 0 && (
              <p className="text-sm text-green-500">
                Todos os dados estão sincronizados.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {offlineAnswers.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">Detalhes dos Dados Pendentes</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Pesquisa</th>
                    <th className="border p-2 text-left">Questão</th>
                    <th className="border p-2 text-left">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {offlineAnswers.map((answer, index) => (
                    <tr key={index} className="border-b">
                      <td className="border p-2">{answer.surveyId}</td>
                      <td className="border p-2">{answer.questionId}</td>
                      <td className="border p-2">{new Date(answer.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SyncPage;