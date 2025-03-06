import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { SurveyAssignment, Survey } from '../../types';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

// Definindo tipos mais específicos
interface SurveyData {
  id: string;
  name: string;
  city: string;
  state: string;
  [key: string]: any; // para outros campos
}

interface AssignmentData {
  id: string;
  survey_id: string;
  researcher_id: string;
  status: string;
  assigned_at: string;
  completed_at: string | null;
  survey: SurveyData;
  [key: string]: any; // para outros campos
}

const ResearcherDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!user) {
      console.log('❌ Usuário não está logado');
      return;
    }

    console.log('🔄 Iniciando busca de atribuições...', {
      timestamp: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      lastFetch: lastFetch?.toISOString()
    });
    
    setIsLoading(true);
    setError(null);

    try {
      // Primeiro, verifica se o usuário existe e tem papel de pesquisador
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .single();

      if (userError) {
        throw new Error(`Erro ao verificar usuário: ${userError.message}`);
      }

      if (!userData || userData.role !== 'researcher') {
        throw new Error('Usuário não tem permissão de pesquisador');
      }

      console.log('👤 Usuário verificado:', userData);

      // Busca as atribuições com left join para as pesquisas
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('survey_assignments')
        .select(`
          id,
          survey_id,
          researcher_id,
          status,
          assigned_at,
          completed_at,
          survey:surveys!left (
            id,
            name,
            city,
            state,
            date,
            contractor,
            code,
            current_manager
          )
        `)
        .eq('researcher_id', user.id)
        .is('deleted_at', null) // Garante que não pegue registros deletados
        .order('assigned_at', { ascending: false });

      if (assignmentsError) {
        console.error('❌ Erro detalhado:', {
          message: assignmentsError.message,
          details: assignmentsError.details,
          hint: assignmentsError.hint,
          code: assignmentsError.code
        });
        throw new Error(`Erro ao buscar atribuições: ${assignmentsError.message}`);
      }

      if (!assignmentsData) {
        console.warn('⚠️ Nenhum dado retornado na busca de atribuições');
        setAssignments([]);
        return;
      }

      console.log('📊 Dados recebidos:', {
        total: assignmentsData.length,
        assignments: assignmentsData.map(a => ({
          id: a.id,
          survey_id: a.survey_id,
          status: a.status,
          has_survey: !!a.survey,
          assigned_at: new Date(a.assigned_at).toLocaleString()
        }))
      });

      // Filtra atribuições válidas e ordena por data
      const validAssignments = assignmentsData
        .filter(assignment => {
          const isValid = assignment.survey !== null;
          if (!isValid) {
            console.warn('⚠️ Atribuição inválida encontrada:', {
              id: assignment.id,
              survey_id: assignment.survey_id,
              assigned_at: new Date(assignment.assigned_at).toLocaleString()
            });
          }
          return isValid;
        })
        .sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime());

      console.log('✅ Atribuições válidas:', {
        total: validAssignments.length,
        assignments: validAssignments.map(a => ({
          id: a.id,
          survey_name: a.survey.name,
          status: a.status,
          assigned_at: new Date(a.assigned_at).toLocaleString(),
          city: a.survey.city,
          state: a.survey.state
        }))
      });

      if (validAssignments.length === 0) {
        console.log('ℹ️ Nenhuma atribuição válida encontrada');
      }

      setAssignments(validAssignments);
      setLastFetch(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro ao carregar pesquisas:', errorMessage);
      setError(`Erro ao carregar pesquisas: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, lastFetch]);

  useEffect(() => {
    if (!user) {
      console.log('❌ Usuário não está logado, limpando dados...');
      setAssignments([]);
      setError(null);
      return;
    }

    console.log('🔄 Configurando página do pesquisador...', {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role
    });

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
          filter: `researcher_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Mudança detectada:', payload);
          fetchAssignments();
        }
      )
      .subscribe();

    // Atualizar a cada 5 minutos
    const intervalId = setInterval(() => {
      console.log('⏰ Atualizando dados automaticamente...');
      fetchAssignments();
    }, 5 * 60 * 1000);

    return () => {
      console.log('🧹 Limpando recursos...');
      assignmentsSubscription.unsubscribe();
      clearInterval(intervalId);
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

  // Função para testar as permissões do Supabase
  const testSupabasePermissions = async () => {
    if (!user) {
      console.log('❌ Usuário não está logado');
      return;
    }

    console.log('🔍 Iniciando testes de permissão do Supabase...');
    console.log('👤 Usuário atual:', {
      id: user.id,
      role: user.role,
      email: user.email
    });

    try {
      // 1. Teste de leitura da tabela users
      console.log('1️⃣ Testando acesso à tabela users...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.log('❌ Erro ao acessar tabela users:', userError);
      } else {
        console.log('✅ Acesso à tabela users OK:', userData);
      }

      // 2. Teste de leitura da tabela survey_assignments
      console.log('2️⃣ Testando acesso à tabela survey_assignments...');
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('survey_assignments')
        .select('*')
        .eq('researcher_id', user.id);

      if (assignmentsError) {
        console.log('❌ Erro ao acessar tabela survey_assignments:', assignmentsError);
      } else {
        console.log('✅ Acesso à tabela survey_assignments OK:', assignmentsData);
        console.log('📊 Número de atribuições encontradas:', assignmentsData?.length || 0);
        if (assignmentsData?.length > 0) {
          console.log('📝 Primeira atribuição:', assignmentsData[0]);
        }
      }

      // 3. Teste de leitura da tabela surveys
      console.log('3️⃣ Testando acesso direto à tabela surveys...');
      
      // Primeiro busca as atribuições para obter os IDs das pesquisas
      const { data: testAssignments, error: testAssignmentsError } = await supabase
        .from('survey_assignments')
        .select('survey_id, survey:surveys(name)')
        .eq('researcher_id', user.id);

      if (testAssignmentsError) {
        console.log('❌ Erro ao buscar atribuições para teste:', testAssignmentsError);
      } else {
        console.log('✅ Atribuições para teste encontradas:', testAssignments);
        console.log('📝 Detalhes das atribuições:', testAssignments.map(a => ({
          survey_id: a.survey_id,
          survey_name: a.survey?.name || 'Nome não encontrado'
        })));
        
        // Agora testa o acesso às pesquisas atribuídas
        const testSurveyIds = testAssignments.map(a => a.survey_id);
        console.log('🔍 Tentando acessar pesquisas com IDs:', testSurveyIds);

        const { data: surveysData, error: surveysError } = await supabase
          .from('surveys')
          .select('*')
          .in('id', testSurveyIds);

        if (surveysError) {
          console.log('❌ Erro ao acessar tabela surveys:', surveysError);
          console.log('📝 Detalhes do erro:', {
            message: surveysError.message,
            details: surveysError.details,
            hint: surveysError.hint,
            code: surveysError.code
          });
        } else {
          console.log('✅ Acesso à tabela surveys OK:', surveysData);
          console.log('📊 Número de pesquisas acessíveis:', surveysData?.length || 0);
          console.log('📝 Pesquisas encontradas:', surveysData?.map(s => ({
            id: s.id,
            name: s.name,
            city: s.city,
            state: s.state
          })));
          
          // Verifica pesquisas que não foram encontradas
          const foundIds = new Set(surveysData?.map(s => s.id) || []);
          const missingIds = testSurveyIds.filter(id => !foundIds.has(id));
          if (missingIds.length > 0) {
            console.log('⚠️ Pesquisas não encontradas:', missingIds);
            console.log('⚠️ Atribuições correspondentes:', testAssignments.filter(a => missingIds.includes(a.survey_id)));
          }
        }
      }

      // 4. Teste de join entre survey_assignments e surveys
      console.log('4️⃣ Testando join entre survey_assignments e surveys...');
      const { data: joinData, error: joinError } = await supabase
        .from('survey_assignments')
        .select(`
          id,
          survey_id,
          researcher_id,
          status,
          assigned_at,
          completed_at,
          survey:surveys!inner(*)
        `)
        .eq('researcher_id', user.id);

      if (joinError) {
        console.log('❌ Erro ao fazer join:', joinError);
        console.log('📝 Detalhes do erro:', joinError);
      } else {
        console.log('✅ Join OK:', joinData);
        console.log('📊 Número de registros após join:', joinData?.length || 0);
        if (joinData?.length > 0) {
          console.log('📝 Primeiro registro com join:', joinData[0]);
        }
      }

      // 5. Teste de acesso direto a uma pesquisa específica
      if (assignmentsData?.length > 0) {
        const firstAssignment = assignmentsData[0];
        console.log('5️⃣ Testando acesso direto a uma pesquisa específica...');
        const { data: specificSurvey, error: specificError } = await supabase
          .from('surveys')
          .select('*')
          .eq('id', firstAssignment.survey_id)
          .single();

        if (specificError) {
          console.log('❌ Erro ao acessar pesquisa específica:', specificError);
        } else {
          console.log('✅ Acesso à pesquisa específica OK:', specificSurvey);
        }
      }

      console.log('🏁 Testes de permissão concluídos');
    } catch (err) {
      console.error('❌ Erro nos testes:', err);
    }
  };

  // Adiciona botão de teste na interface
  const renderTestButton = () => (
    <Button
      variant="outline"
      size="sm"
      onClick={testSupabasePermissions}
      className="mb-4"
    >
      Testar Permissões do Supabase
    </Button>
  );

  // Renderiza o card de uma atribuição
  const renderAssignmentCard = (assignment: AssignmentData) => (
    <Card key={assignment.id}>
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              {assignment.survey.name || 'Nome não disponível'}
            </h3>
            <p className="text-sm text-gray-500">
              {assignment.survey.city || 'Cidade não disponível'}, {assignment.survey.state || 'Estado não disponível'}
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
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Minhas Pesquisas</h1>
        <div className="flex space-x-2">
          {renderTestButton()}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('🔄 Atualizando manualmente...');
              fetchAssignments();
            }}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {error && (
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
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500 text-center">
              Nenhuma pesquisa atribuída ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignments.map(renderAssignmentCard)}
        </div>
      )}
    </div>
  );
};

export default ResearcherDashboardPage;