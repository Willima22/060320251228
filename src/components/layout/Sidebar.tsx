import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart, 
  ClipboardList, 
  FileText, 
  Home, 
  Settings, 
  Users,
  User,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  
  const isAdmin = user?.role === 'admin';

  const adminLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { to: '/surveys', label: 'Pesquisas', icon: <ClipboardList className="h-5 w-5" /> },
    { to: '/users', label: 'Usuários', icon: <Users className="h-5 w-5" /> },
    { to: '/reports', label: 'Relatórios', icon: <BarChart className="h-5 w-5" /> },
    { to: '/settings', label: 'Configurações', icon: <Settings className="h-5 w-5" /> },
  ];

  const researcherLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { to: '/sync', label: 'Sincronização', icon: <RefreshCw className="h-5 w-5" /> },
    { to: '/profile', label: 'Meu Perfil', icon: <User className="h-5 w-5" /> },
  ];

  const links = isAdmin ? adminLinks : researcherLinks;

  return (
    <aside
      className={`bg-gray-800 text-white fixed inset-y-0 left-0 z-20 w-64 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      <div className="p-6">
        <h2 className="text-xl font-bold">Sistema de Pesquisa</h2>
      </div>
      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          {links.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                  location.pathname === link.to
                    ? 'bg-blue-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{link.icon}</span>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;