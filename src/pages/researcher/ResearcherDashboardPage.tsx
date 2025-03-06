import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { SurveyAssignment, Survey } from '../../types';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

interface AssignmentWithSurvey extends SurveyAssignment {
  survey: Survey;
}

const ResearcherDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<AssignmentWithSurvey[]>([]);
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

      if (error) throw error;

      if (!data) {
        console.log('Nenhuma atribuição encontrada');
        setAssignments([]);
        return;
      }

      const validAssignments = data
        .filter((item): item is AssignmentWithSurvey => {
          if (!item.survey) {
            console.warn('Item sem dados da pesquisa:', item);
            return false;
          }
          return true;
        })
        .map(item => ({
          ...item,
          survey: item.survey as Survey
        }));

      console.log('Atribuições carregadas:', validAssignments.length);
      setAssignments(validAssignments);
    } catch (err) {
      console.error('Erro ao carregar pesquisas:', err);
      setError('Erro ao carregar pesquisas atribuídas. Por favor, tente novamente.');
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
        (payload) => {
          console.log('Mudança detectada nas atribuições:', payload);
          fetchAssignments();
        }
      )
      .subscribe();

    return () => {
      console.log('Cancelando inscrição de atualizações em tempo real');
      assignmentsSubscription.unsubscribe();
    };
  }, [user, fetchAssignments]);

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'in_progress':
        return 'Em Andamento';
      default:
        return 'Pendente';
    }
  };

  const getStatusStyle = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" className="mb-4">
        {error}
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAssignments}
          className="mt-2"
        >
          Tentar Novamente
        </Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Minhas Pesquisas</h1>

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
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">{assignment.survey.name}</h3>
                    <p className="text-sm text-gray-500">
                      {assignment.survey.city}, {assignment.survey.state}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(
                          assignment.status
                        )}`}
                      >
                        {getStatusText(assignment.status)}
                      </span>
                      {assignment.assigned_at && (
                        <span className="text-xs text-gray-500">
                          Atribuída em: {new Date(assignment.assigned_at).toLocaleDateString()}
                        </span>
                      )}
                      {assignment.completed_at && (
                        <span className="text-xs text-gray-500">
                          Concluída em: {new Date(assignment.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link to={`/surveys/${assignment.survey_id}/fill`}>
                    <Button>
                      {assignment.status === 'completed' ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Ver Respostas
                        </>
                      ) : (
                        <>
                          <ClipboardList className="h-4 w-4 mr-2" />
                          Preencher Pesquisa
                        </>
                      )}
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