import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} />
      
      <div className="lg:pl-64 flex flex-col">
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default Layout;