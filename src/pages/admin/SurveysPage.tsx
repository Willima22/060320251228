import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Plus, Trash, Copy } from 'lucide-react';
import { useSurveyStore } from '../../store/surveyStore';
import Button from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';

const SurveysPage: React.FC = () => {
  const { surveys, fetchSurveys, deleteSurvey, duplicateSurvey } = useSurveyStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<string | null>(null);

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

  const handleDeleteClick = (id: string) => {
    setSurveyToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!surveyToDelete) return;

    try {
      await deleteSurvey(surveyToDelete);
      setDeleteModalOpen(false);
      setSurveyToDelete(null);
    } catch (err) {
      setError('Erro ao excluir pesquisa.');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateSurvey(id);
    } catch (err) {
      setError('Erro ao duplicar pesquisa.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pesquisas</h1>
        <Link to="/surveys/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Pesquisa
          </Button>
        </Link>
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : surveys.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cidade/Estado</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Contratante</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.map((survey) => (
                <TableRow key={survey.id}>
                  <TableCell className="font-medium">{survey.name}</TableCell>
                  <TableCell>
                    {survey.city}/{survey.state}
                  </TableCell>
                  <TableCell>{new Date(survey.date).toLocaleDateString()}</TableCell>
                  <TableCell>{survey.code}</TableCell>
                  <TableCell>{survey.contractor}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(survey.id)}
                        title="Duplicar"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Link to={`/surveys/${survey.id}/edit`}>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(survey.id)}
                        title="Excluir"
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 mb-4">Nenhuma pesquisa encontrada.</p>
          <Link to="/surveys/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Pesquisa
            </Button>
          </Link>
        </div>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar exclusão"
      >
        <p className="mb-4">Tem certeza que deseja excluir esta pesquisa? Esta ação não pode ser desfeita.</p>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setDeleteModalOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
          >
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SurveysPage;