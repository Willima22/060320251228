import React, { useEffect, useState } from 'react';
import { BarChart, ClipboardList, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { useSurveyStore } from '../../store/surveyStore';
import { useUserStore } from '../../store/userStore';
import { supabase } from '../../lib/supabase';

const DashboardPage: React.FC = () => {
  const { surveys, fetchSurveys } = useSurveyStore();
  const { users, fetchUsers } = useUserStore();
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchSurveys(),
        fetchUsers(),
        fetchTotalAnswers(),
      ]);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const fetchTotalAnswers = async () => {
    try {
      const { count, error } = await supabase
        .from('answers')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching answers count:', error);
        return;
      }

      setTotalAnswers(count || 0);
    } catch (err) {
      console.error('Error fetching answers count:', err);
    }
  };

  const stats = [
    {
      title: 'Total de Pesquisas',
      value: surveys.length,
      icon: <ClipboardList className="h-8 w-8 text-blue-500" />,
      color: 'bg-blue-100',
    },
    {
      title: 'Total de Usuários',
      value: users.length,
      icon: <Users className="h-8 w-8 text-green-500" />,
      color: 'bg-green-100',
    },
    {
      title: 'Total de Respostas',
      value: totalAnswers,
      icon: <BarChart className="h-8 w-8 text-purple-500" />,
      color: 'bg-purple-100',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-full mr-4 ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Pesquisas Recentes</h2>
              </CardHeader>
              <CardContent>
                {surveys.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {surveys.slice(0, 5).map((survey) => (
                      <li key={survey.id} className="py-3">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{survey.name}</p>
                            <p className="text-sm text-gray-500">
                              {survey.city}, {survey.state}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(survey.date).toLocaleDateString()}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">Nenhuma pesquisa encontrada.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Usuários Recentes</h2>
              </CardHeader>
              <CardContent>
                {users.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {users.slice(0, 5).map((user) => (
                      <li key={user.id} className="py-3">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              user.role === 'admin'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {user.role === 'admin' ? 'Admin' : 'Pesquisador'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">Nenhum usuário encontrado.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;