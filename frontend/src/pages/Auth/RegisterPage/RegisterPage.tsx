// src/pages/auth/RegisterPage/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
 
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
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
   

      <div className="register-page">
        {/* Intro Section */}
        <div className="section text-center">
          <h2>Join SkillShare Hub Today</h2>
          <p>Create your free account and start your learning journey with us</p>
        </div>

        {/* Register Container */}
        <div className="register-container">
          {/* Left column: Welcome */}
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
            <div className="form-container">
              <h3>Create Your Account</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fullName = (e.currentTarget.elements.namedItem('fullName') as HTMLInputElement).value;
                  const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
                  const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
                  const role = (e.currentTarget.elements.namedItem('role') as HTMLSelectElement).value as
                    | 'student'
                    | 'instructor';
                  handleRegister({ fullName, email, password, role });
                }}
              >
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="fullName" className="form-control" placeholder="Enter your name" required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" className="form-control" placeholder="Enter your email" required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select name="role" className="form-control">
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                  </select>
                </div>
                <button type="submit" className="btn" disabled={isLoading}>
                  {isLoading ? 'Registering...' : 'Register'}
                </button>
              </form>

              {/* Login Prompt */}
              <div className="register-prompt">
                <p>
                  Already have an account?{' '}
                  <span onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: '#4361ee' }}>
                    Login here
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="section about-section">
          <h2 className="text-center">Why Choose SkillShare Hub?</h2>
          <div className="about-grid">
            <div className="about-item">Expert Instructors</div>
            <div className="about-item">Interactive Learning</div>
            <div className="about-item">Flexible Scheduling</div>
            <div className="about-item">Global Community</div>
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
      </div>

      {/* Footer */}
 
    </>
  );
};

export default RegisterPage;
