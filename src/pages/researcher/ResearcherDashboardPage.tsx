import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { SurveyAssignment, Survey } from '../../types';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const ResearcherDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<(SurveyAssignment & { survey: Survey })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!user) {
      console.log('Usuário não está logado');
      return;
    }

    console.log('Buscando atribuições para o usuário:', user.id);
    setIsLoading(true);
    setError(null);

    try {
      // Buscar atribuições com detalhes da pesquisa
      const { data, error } = await supabase
        .from('survey_assignments')
        .select(`
          id,
          survey_id,
          researcher_id,
          status,
          assigned_at,
          completed_at,
          survey:surveys(*)
        `)
        .eq('researcher_id', user.id)
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }

      console.log('Dados retornados do Supabase:', data);

      if (!data) {
        console.log('Nenhum dado retornado');
        setAssignments([]);
        return;
      }

      // Transformar os dados para o formato esperado
      const formattedAssignments = data.map(item => {
        console.log('Processando item:', item);
        if (!item.survey) {
          console.warn('Item sem dados da pesquisa:', item);
          return null;
        }
        return {
          ...item,
          survey: item.survey as Survey
        };
      }).filter(Boolean) as (SurveyAssignment & { survey: Survey })[];

      console.log('Atribuições formatadas:', formattedAssignments);
      setAssignments(formattedAssignments);
    } catch (err) {
      console.error('Erro detalhado ao carregar pesquisas:', err);
      setError('Erro ao carregar pesquisas atribuídas.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAssignments();

    // Inscrever para atualizações em tempo real
    const assignmentsSubscription = supabase
      .channel('survey_assignments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'survey_assignments',
          filter: `researcher_id=eq.${user?.id}`
        },
        () => {
          console.log('Mudança detectada nas atribuições');
          fetchAssignments();
        }
      )
      .subscribe();

    return () => {
      assignmentsSubscription.unsubscribe();
    };
  }, [user, fetchAssignments]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Minhas Pesquisas</h1>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500 text-center">
              Nenhuma pesquisa atribuída ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">{assignment.survey.name}</h3>
                    <p className="text-sm text-gray-500">
                      {assignment.survey.city}, {assignment.survey.state}
                    </p>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assignment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : assignment.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {assignment.status === 'completed'
                          ? 'Concluída'
                          : assignment.status === 'in_progress'
                          ? 'Em Andamento'
                          : 'Pendente'}
                      </span>
                    </div>
                  </div>
                  <Link to={`/surveys/${assignment.survey_id}/fill`}>
                    <Button>
                      {assignment.status === 'completed'
                        ? 'Ver Respostas'
                        : 'Preencher Pesquisa'}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResearcherDashboardPage;