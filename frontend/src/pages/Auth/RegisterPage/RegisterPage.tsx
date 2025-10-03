// src/pages/auth/RegisterPage/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import RegisterForm from '../../../components/auth/RegisterForm';

import './RegisterPage.css';

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'instructor';
}

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      await register(data.email, data.password, data.fullName, data.role);
      navigate('/dashboard');
    } catch (error) {
      console.error("Register failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Intro Section */}
      <div className="section text-center">
        <h2>Join SkillShare Hub Today</h2>
        <p>Create your free account and start your learning journey with us</p>
      </div>

      {/* Register Container */}
      <div className="register-container">
        {/* Left column: Why join */}
        <div className="register-welcome">
          <h2>Why Join Us?</h2>
          <p>Discover knowledge, connect with mentors, and grow your skills.</p>
          <ul>
            <li>Learn from top instructors</li>
            <li>Access flexible schedules</li>
            <li>Get personalized recommendations</li>
            <li>Join a learning community</li>
          </ul>
        </div>

        {/* Right column: Register Form */}
        <div className="register-form-container">
          <RegisterForm 
            onSubmit={handleRegister} 
            onLogin={() => navigate('/login')} 
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Testimonials */}
      <div className="section">
        <h2 className="text-center">What New Members Say</h2>
        <div className="testimonials">
          <div className="testimonial-card">
            <h3>Seamless Signup</h3>
            <p>"The registration was super quick and I got access to courses instantly."</p>
            <p>— Emily Tran, Student</p>
          </div>
          <div className="testimonial-card">
            <h3>Instructor Friendly</h3>
            <p>"As an instructor, I can easily manage my classes and connect with students."</p>
            <p>— John Lee, Instructor</p>
          </div>
        </div>
      </div>

      {/* Footer nếu muốn có thể tách riêng */}
    </div>
  );
};

export default RegisterPage;
