import React, { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { SurveyAssignment, Survey } from '../../types';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

const ResearcherDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<(SurveyAssignment & { survey: Survey })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch assignments for this researcher
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('survey_assignments')
          .select('*')
          .eq('researcherId', user.id);

        if (assignmentsError) {
          throw assignmentsError;
        }

        // Fetch survey details for each assignment
        const assignmentsWithSurveys = await Promise.all(
          assignmentsData.map(async (assignment) => {
            const { data: surveyData, error: surveyError } = await supabase
              .from('surveys')
              .select('*')
              .eq('id', assignment.surveyId)
              .single();

            if (surveyError) {
              throw surveyError;
            }

            return {
              ...assignment,
              survey: surveyData,
            };
          })
        );

        setAssignments(assignmentsWithSurveys);
      } catch (err) {
        setError('Erro ao carregar pesquisas atribuídas.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard do Pesquisador</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full mr-4 bg-blue-100">
                    <ClipboardList className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total de Pesquisas</p>
                    <p className="text-2xl font-bold">{assignments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full mr-4 bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pesquisas Concluídas</p>
                    <p className="text-2xl font-bold">
                      {assignments.filter((a) => a.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full mr-4 bg-yellow-100">
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pesquisas Pendentes</p>
                    <p className="text-2xl font-bold">
                      {assignments.filter((a) => a.status !== 'completed').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-xl font-semibold mb-4">Minhas Pesquisas</h2>

          {assignments.length > 0 ? (
            <div className="space-y-4">
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
                      <Link to={`/surveys/${assignment.surveyId}/fill`}>
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
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">
                Nenhuma pesquisa atribuída a você no momento.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResearcherDashboardPage;