// src/pages/auth/ResetPasswordPage/ResetPasswordPage.tsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ResetPasswordForm from '../../../components/auth/ForgotPassword/ResetPasswordForm';
import { authService } from '../../../services/api/authService';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const token = searchParams.get('token');

  const handleSubmit = async (token: string, newPassword: string) => {
    setIsLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Invalid Link</h3>
          <p className="text-gray-600 mb-6">The reset password link is invalid or has expired.</p>
          <button
            onClick={handleBackToLogin}
            className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <ResetPasswordForm
        token={token}
        onSubmit={handleSubmit}
        onBackToLogin={handleBackToLogin}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ResetPasswordPage;