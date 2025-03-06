import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import EmailConfirmationPage from '../pages/auth/EmailConfirmationPage';
import WelcomePage from '../pages/WelcomePage';

interface RootRouteProps {
  hasAdminUser: boolean | null;
}

const RootRoute: React.FC<RootRouteProps> = ({ hasAdminUser }) => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  if (searchParams.get('code')) {
    return <EmailConfirmationPage />;
  }

  if (hasAdminUser === false) {
    return <WelcomePage />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return <Navigate to="/login" />;
};

export default RootRoute; 