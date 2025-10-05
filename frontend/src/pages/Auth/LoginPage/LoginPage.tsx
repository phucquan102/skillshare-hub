// src/pages/auth/LoginPage/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import LoginForm from '../../../components/auth/LoginForm';
import { authService } from '../../../services/api/authService'; // Thêm import này

import './LoginPage.css';

interface LoginData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // src/pages/auth/LoginPage/LoginPage.tsx
const handleLogin = async (data: LoginData) => {
  setIsLoading(true);
  try {
    // Login sẽ tự động set user vào context
    await login(data.email, data.password);
    
    // Đợi một chút để context update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Lấy user từ context thay vì gọi API lại
    const { user } = await authService.getProfile();
    
    // Điều hướng dựa trên role
    switch (user.role) {
      case 'admin':
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'instructor':
        navigate('/instructor/dashboard', { replace: true });
        break;
      case 'student':
      default:
        navigate('/dashboard', { replace: true });
        break;
    }
  } catch (error) {
    console.error("Login failed:", error);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="login-page">
      {/* Intro / Header */}
      <div className="section text-center">
        <h2>Welcome Back to SkillShare Hub</h2>
        <p>Sign in to continue your learning journey and access your dashboard</p>
      </div>

      {/* Container */}
      <div className="login-container">
        {/* Left Column */}
        <div className="login-welcome">
          <h2>Continue Your Learning Journey</h2>
          <p>Access your courses, track progress, and connect with instructors.</p>
          <ul>
            <li>Access your purchased courses</li>
            <li>View upcoming sessions</li>
            <li>Track your learning progress</li>
            <li>Connect with instructors</li>
          </ul>
        </div>

        {/* Right Column: Login Form */}
        <div className="login-form-container">
          <LoginForm 
            onSubmit={handleLogin} 
            onRegister={() => navigate('/register')} 
            isLoading={isLoading} 
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;