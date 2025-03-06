import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';

// Layout
import Layout from './components/layout/Layout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import WelcomePage from './pages/WelcomePage';

// Admin pages
import DashboardPage from './pages/admin/DashboardPage';
import SurveysPage from './pages/admin/SurveysPage';
import SurveyFormPage from './pages/admin/SurveyFormPage';
import SurveyQuestionsPage from './pages/admin/SurveyQuestionsPage';
import UsersPage from './pages/admin/UsersPage';
import UserFormPage from './pages/admin/UserFormPage';
import ReportsPage from './pages/admin/ReportsPage';

// Researcher pages
import ResearcherDashboardPage from './pages/researcher/ResearcherDashboardPage';
import ProfilePage from './pages/researcher/ProfilePage';
import ResearcherSurveyFormPage from './pages/researcher/SurveyFormPage';
import SyncPage from './pages/researcher/SyncPage';

function App() {
  const { isAuthenticated, user, checkAuth, isLoading } = useAuthStore();
  const [hasAdminUser, setHasAdminUser] = useState<boolean | null>(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    checkAuth();
    
    // Check if there's at least one admin user
    const checkAdminUser = async () => {
      try {
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');
          
        if (error) {
          console.error('Error checking admin users:', error);
          setHasAdminUser(false);
        } else {
          setHasAdminUser(count ? count > 0 : false);
        }
      } catch (err) {
        console.error('Error checking admin users:', err);
        setHasAdminUser(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };
    
    checkAdminUser();
  }, [checkAuth]);

  if (isLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Welcome page if no admin exists */}
        {hasAdminUser === false && (
          <Route path="/" element={<WelcomePage />} />
        )}
        
        {/* Public routes */}
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        {isAuthenticated && (
          <Route element={<Layout />}>
            {/* Admin routes */}
            {user?.role === 'admin' && (
              <>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/surveys" element={<SurveysPage />} />
                <Route path="/surveys/new" element={<SurveyFormPage />} />
                <Route path="/surveys/:id/edit" element={<SurveyFormPage />} />
                <Route path="/surveys/:id/questions" element={<SurveyQuestionsPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/new" element={<UserFormPage />} />
                <Route path="/users/:id/edit" element={<UserFormPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<div>Settings Page</div>} />
              </>
            )}

            {/* Researcher routes */}
            {user?.role === 'researcher' && (
              <>
                <Route path="/dashboard" element={<ResearcherDashboardPage />} />
                <Route path="/surveys/:id/fill" element={<ResearcherSurveyFormPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/sync" element={<SyncPage />} />
              </>
            )}
          </Route>
        )}

        {/* Redirect to login if not authenticated */}
        <Route path="*" element={
          hasAdminUser === false 
            ? <Navigate to="/" /> 
            : (isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />)
        } />
      </Routes>
    </Router>
  );
}

export default App;