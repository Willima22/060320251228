import React, { useEffect, useState } from 'react';
import { Edit, Plus, Trash, ClipboardList } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { useSurveyStore } from '../../store/surveyStore';
import Button from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { User } from '../../types';

const UsersPage: React.FC = () => {
  const { users, fetchUsers, deleteUser, assignSurveyToUser } = useUserStore();
  const { surveys, fetchSurveys } = useSurveyStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [userToAssign, setUserToAssign] = useState<User | null>(null);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([fetchUsers(), fetchSurveys()]);
      } catch (err) {
        setError('Erro ao carregar dados.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchUsers, fetchSurveys]);

  const handleDeleteClick = (id: string) => {
    setUserToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete);
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      setError('Erro ao excluir usuário.');
    }
  };

  const handleAssignClick = (user: User) => {
    setUserToAssign(user);
    setSelectedSurveyId('');
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!userToAssign || !selectedSurveyId) return;

    try {
      await assignSurveyToUser(userToAssign.id, selectedSurveyId);
      setAssignModalOpen(false);
      setUserToAssign(null);
      setSelectedSurveyId('');
    } catch (err) {
      setError('Erro ao atribuir pesquisa.');
    }
  };

  const researcherUsers = users.filter(user => user.role === 'researcher');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Usuários Pesquisadores</h1>
        <Button onClick={() => window.location.href = '/users/new'}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : researcherUsers.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {researcherUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.cpf}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignClick(user)}
                        title="Atribuir Pesquisa"
                      >
                        <ClipboardList className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/users/${user.id}/edit`}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(user.id)}
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
          <p className="text-gray-500 mb-4">Nenhum usuário pesquisador encontrado.</p>
          <Button onClick={() => window.location.href = '/users/new'}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Usuário
          </Button>
        </div>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar exclusão"
      >
        <p className="mb-4">Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.</p>
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

      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Atribuir Pesquisa"
      >
        <div className="space-y-4">
          <p>
            Atribuir pesquisa para: <strong>{userToAssign?.name}</strong>
          </p>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selecione a Pesquisa
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedSurveyId}
              onChange={(e) => setSelectedSurveyId(e.target.value)}
            >
              <option value="">Selecione uma pesquisa</option>
              {surveys.map((survey) => (
                <option key={survey.id} value={survey.id}>
                  {survey.name} ({survey.city}/{survey.state})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setAssignModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAssign}
              disabled={!selectedSurveyId}
            >
              Atribuir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;