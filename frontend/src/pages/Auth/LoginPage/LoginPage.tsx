// src/pages/auth/LoginPage/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import LoginForm from '../../../components/auth/LoginForm';

import './LoginPage.css';

interface LoginData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (data: LoginData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
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
