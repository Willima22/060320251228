import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { BarChart, Download, FileText } from 'lucide-react';
import { useSurveyStore } from '../../store/surveyStore';
import { useReportStore } from '../../store/reportStore';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ReportFormData {
  surveyId: string;
  variable: string;
  crossVariables: string[];
}

const ReportsPage: React.FC = () => {
  const { surveys, fetchSurveys, getSurvey, currentSurvey } = useSurveyStore();
  const {
    generateVariableReport,
    generateCrossReport,
    generateSampleReport,
    generateItemReport,
    currentReport,
    exportReport,
  } = useReportStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReportFormData>();
  
  const selectedSurveyId = watch('surveyId');
  
  useEffect(() => {
    const loadSurveys = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await fetchSurveys();
      } catch (err) {
        setError('Erro ao carregar pesquisas.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSurveys();
  }, [fetchSurveys]);
  
  useEffect(() => {
    if (selectedSurveyId) {
      getSurvey(selectedSurveyId);
    }
  }, [selectedSurveyId, getSurvey]);
  
  useEffect(() => {
    if (currentReport && currentReport.data) {
      prepareChartData();
    }
  }, [currentReport]);
  
  const prepareChartData = () => {
    if (!currentReport) return;
    
    let data;
    
    if (currentReport.type === 'variable') {
      data = {
        labels: currentReport.data.map((item: any) => item.value),
        datasets: [
          {
            label: 'Percentual',
            data: currentReport.data.map((item: any) => item.percentage),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      };
    } else if (currentReport.type === 'cross') {
      // For cross reports, we'll show the first variable's data
      const firstItem = currentReport.data[0];
      if (firstItem) {
        data = {
          labels: firstItem.details.map((item: any) => item.value),
          datasets: [
            {
              label: `${firstItem.value}`,
              data: firstItem.details.map((item: any) => item.percentage),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
          ],
        };
      }
    } else if (currentReport.type === 'sample') {
      // For sample reports, we'll show the first question's data
      const firstItem = currentReport.data[0];
      if (firstItem) {
        data = {
          labels: firstItem.details.map((item: any) => item.value),
          datasets: [
            {
              label: `Questão ${firstItem.questionId}`,
              data: firstItem.details.map((item: any) => item.percentage),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
          ],
        };
      }
    }
    
    setChartData(data);
  };
  
  const onGenerateVariableReport = async (data: ReportFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await generateVariableReport(data.surveyId, data.variable);
    } catch (err) {
      setError('Erro ao gerar relatório.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onGenerateCrossReport = async (data: ReportFormData) => {
    if (data.crossVariables.length < 2) {
      setError('Selecione pelo menos duas variáveis para cruzamento.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await generateCrossReport(data.surveyId, data.crossVariables);
    } catch (err) {
      setError('Erro ao gerar relatório de cruzamento.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onGenerateSampleReport = async () => {
    if (!selectedSurveyId) {
      setError('Selecione uma pesquisa.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await generateSampleReport(selectedSurveyId);
    } catch (err) {
      setError('Erro ao gerar relatório de plano amostral.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onGenerateItemReport = async () => {
    if (!selectedSurveyId) {
      setError('Selecione uma pesquisa.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await generateItemReport(selectedSurveyId);
    } catch (err) {
      setError('Erro ao gerar relatório por item.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExport = async (format: 'csv' | 'excel') => {
    if (!currentReport) return;
    
    try {
      const data = await exportReport(currentReport.id, format);
      
      // Create a blob and download it
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${currentReport.id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Erro ao exportar relatório.');
    }
  };
  
  const variableReportTab = (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onGenerateVariableReport)} className="space-y-4">
        <Select
          label="Pesquisa"
          options={surveys.map(survey => ({
            value: survey.id,
            label: `${survey.name} (${survey.city}/${survey.state})`,
          }))}
          error={errors.surveyId?.message}
          {...register('surveyId', {
            required: 'Pesquisa é obrigatória',
          })}
        />
        
        {currentSurvey && (
          <Select
            label="Variável"
            options={currentSurvey.questions.map(question => ({
              value: question.id,
              label: question.text,
            }))}
            error={errors.variable?.message}
            {...register('variable', {
              required: 'Variável é obrigatória',
            })}
          />
        )}
        
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!currentSurvey}
        >
          <BarChart className="h-4 w-4 mr-2" />
          Gerar Relatório
        </Button>
      </form>
      
      {currentReport && currentReport.type === 'variable' && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Resultado</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {chartData && (
              <div className="h-80">
                <Bar
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return value + '%';
                          }
                        }
                      }
                    },
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">Dados Detalhados</h4>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Valor</th>
                    <th className="border p-2 text-left">Contagem</th>
                    <th className="border p-2 text-left">Percentual</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReport.data.map((item: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="border p-2">{item.value}</td>
                      <td className="border p-2">{item.count}</td>
                      <td className="border p-2">{item.percentage.toFixed(2)}%</td>
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
  
  const crossReportTab = (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onGenerateCrossReport)} className="space-y-4">
        <Select
          label="Pesquisa"
          options={surveys.map(survey => ({
            value: survey.id,
            label: `${survey.name} (${survey.city}/${survey.state})`,
          }))}
          error={errors.surveyId?.message}
          {...register('surveyId', {
            required: 'Pesquisa é obrigatória',
          })}
        />
        
        {currentSurvey && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variáveis para Cruzamento (selecione pelo menos 2)
            </label>
            <div className="space-y-2">
              {currentSurvey.questions.map(question => (
                <div key={question.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={question.id}
                    value={question.id}
                    {...register('crossVariables')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={question.id} className="ml-2 text-sm text-gray-700">
                    {question.text}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!currentSurvey}
        >
          <BarChart className="h-4 w-4 mr-2" />
          Gerar Relatório de Cruzamento
        </Button>
      </form>
      
      {currentReport && currentReport.type === 'cross' && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Resultado do Cruzamento</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {chartData && (
              <div className="h-80">
                <Bar
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return value + '%';
                          }
                        }
                      }
                    },
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">Dados Detalhados</h4>
              {currentReport.data.map((item: any, index: number) => (
                <div key={index} className="mb-6">
                  <h5 className="font-medium mb-2">{item.value}</h5>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Valor</th>
                        <th className="border p-2 text-left">Contagem</th>
                        <th className="border p-2 text-left">Percentual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.details.map((detail: any, detailIndex: number) => (
                        <tr key={detailIndex} className="border-b">
                          <td className="border p-2">{detail.value}</td>
                          <td className="border p-2">{detail.count}</td>
                          <td className="border p-2">{detail.percentage.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
  
  const sampleReportTab = (
    <div className="space-y-4">
      <div className="space-y-4">
        <Select
          label="Pesquisa"
          options={surveys.map(survey => ({
            value: survey.id,
            label: `${survey.name} (${survey.city}/${survey.state})`,
          }))}
          value={selectedSurveyId}
          onChange={(e) => getSurvey(e.target.value)}
        />
        
        <Button
          onClick={onGenerateSampleReport}
          isLoading={isLoading}
          disabled={!selectedSurveyId}
        >
          <BarChart className="h-4 w-4 mr-2" />
          Gerar Plano Amostral
        </Button>
      </div>
      
      {currentReport && currentReport.type === 'sample' && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Plano Amostral</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {currentReport.data.map((item: any, index: number) => (
              <div key={index} className="mb-6">
                <h4 className="font-medium mb-2">
                  Questão: {currentSurvey?.questions.find(q => q.id === item.questionId)?.text || item.questionId}
                </h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Valor</th>
                      <th className="border p-2 text-left">Contagem</th>
                      <th className="border p-2 text-left">Percentual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.details.map((detail: any, detailIndex: number) => (
                      <tr key={detailIndex} className="border-b">
                        <td className="border p-2">{detail.value}</td>
                        <td className="border p-2">{detail.count}</td>
                        <td className="border p-2">{detail.percentage.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
  
  const itemReportTab = (
    <div className="space-y-4">
      <div className="space-y-4">
        <Select
          label="Pesquisa"
          options={surveys.map(survey => ({
            value: survey.id,
            label: `${survey.name} (${survey.city}/${survey.state})`,
          }))}
          value={selectedSurveyId}
          onChange={(e) => getSurvey(e.target.value)}
        />
        
        <Button
          onClick={onGenerateItemReport}
          isLoading={isLoading}
          disabled={!selectedSurveyId}
        >
          <FileText className="h-4 w-4 mr-2" />
          Gerar Relatório por Item
        </Button>
      </div>
      
      {currentReport && currentReport.type === 'item' && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Relatório por Item</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {currentReport.data.map((item: any, index: number) => (
              <div key={index} className="mb-6">
                <h4 className="font-medium mb-2">
                  {item.questionText}
                </h4>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Pesquisador</th>
                      <th className="border p-2 text-left">Resposta</th>
                      <th className="border p-2 text-left">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.answers.map((answer: any, answerIndex: number) => (
                      <tr key={answerIndex} className="border-b">
                        <td className="border p-2">{answer.researcherId}</td>
                        <td className="border p-2">{answer.answer}</td>
                        <td className="border p-2">
                          {new Date(answer.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Relatórios</h1>
      
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      
      <Tabs
        tabs={[
          {
            id: 'variable',
            label: 'Por Variável',
            content: variableReportTab,
          },
          {
            id: 'cross',
            label: 'Cruzamento',
            content: crossReportTab,
          },
          {
            id: 'sample',
            label: 'Plano Amostral',
            content: sampleReportTab,
          },
          {
            id: 'item',
            label: 'Por Item',
            content: itemReportTab,
          },
        ]}
      />
    </div>
  );
};

export default ReportsPage;