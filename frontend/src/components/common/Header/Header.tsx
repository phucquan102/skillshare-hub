import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import LoginForm from '../../../components/auth/LoginForm/LoginForm';
import RegisterForm from '../../../components/auth/RegisterForm/RegisterForm';

const Header: React.FC = () => {
  const { user, logout, login, register } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    setIsRegisterModalOpen(false);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const openRegisterModal = () => {
    setIsRegisterModalOpen(true);
    setIsLoginModalOpen(false);
  };

  const closeRegisterModal = () => {
    setIsRegisterModalOpen(false);
  };

  const handleLogin = async (loginData: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      await login(loginData.email, loginData.password);
      closeLoginModal();
      console.log('Login successful');
    } catch (error: any) {
      console.error('Login failed:', error);
      // Error sẽ được hiển thị trong LoginForm component
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (registerData: { 
    email: string; 
    password: string; 
    fullName: string; 
    role: 'student' | 'instructor' 
  }) => {
    setIsLoading(true);
    try {
      await register(
        registerData.email, 
        registerData.password, 
        registerData.fullName, 
        registerData.role
      );
      closeRegisterModal();
      console.log('Registration successful');
    } catch (error: any) {
      console.error('Registration failed:', error);
      // Error sẽ được hiển thị trong RegisterForm component
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className="w-full bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
            <span className="font-bold text-lg">EduPress</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex gap-6 text-gray-700 font-medium">
            <a href="#" className="hover:text-orange-500">Home</a>
            <a href="#" className="hover:text-orange-500">Courses</a>
            <a href="#" className="hover:text-orange-500">Blog</a>
            <a href="#" className="hover:text-orange-500">About</a>
            <a href="#" className="hover:text-orange-500">Contact</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-700">
                  Xin chào, {user.fullName || user.email}
                </span>
                
                {/* Thêm liên kết Admin Panel nếu user có role là admin */}
                {user.role === 'admin' && (
                  <Link 
                    to="/admin/dashboard" 
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Admin Panel
                  </Link>
                )}
                
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={openLoginModal}
                  className="hidden md:inline px-4 py-2 text-sm border rounded hover:bg-gray-100"
                >
                  Login
                </button>
                <button
                  onClick={openRegisterModal}
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-md w-full relative">
            <button
              onClick={closeLoginModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
          </div>
        </div>
      )}

      {/* Register Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-md w-full relative">
            <button
              onClick={closeRegisterModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
          </div>
        </div>
      )}
    </>
  );
};

export default Header;