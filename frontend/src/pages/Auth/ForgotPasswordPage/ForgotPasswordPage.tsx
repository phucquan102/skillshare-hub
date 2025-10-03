// src/pages/auth/ForgotPasswordPage/ForgotPasswordPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordForm from '../../../components/auth/ForgotPassword/ForgotPasswordForm';
import { authService } from '../../../services/api/authService';
import { ForgotPasswordData } from '../../../types/user.types';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <ForgotPasswordForm
        onSubmit={handleSubmit}
        onBackToLogin={handleBackToLogin}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ForgotPasswordPage;