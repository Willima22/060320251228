import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="ml-4 font-bold text-xl text-blue-600">
              Sistema de Pesquisa
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              {user?.name}
            </div>
            <div className="relative">
              <div className="flex items-center space-x-2">
                <div className="bg-gray-200 rounded-full p-2">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;