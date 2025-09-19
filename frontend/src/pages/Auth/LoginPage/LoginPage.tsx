// src/pages/auth/LoginPage/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../../components/common/Header/Header';
import Footer from '../../../components/common/Footer/Footer';
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
      throw error; // Có thể hiển thị lỗi tại LoginForm
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <Header />

      <div className="login-page">
        {/* Intro Section */}
        <div className="section text-center">
          <h2>Welcome Back to SkillShare Hub</h2>
          <p>Sign in to continue your learning journey and access your personalized dashboard</p>
        </div>

        {/* Login Container */}
        <div className="login-container">
          {/* Left column: Welcome */}
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

          {/* Right column: Login Form */}
          <div className="login-form-container">
            <div className="form-container">
              <h3>Login to Your Account</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
                  const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
                  handleLogin({ email, password });
                }}
              >
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" className="form-control" placeholder="Enter your email" required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" name="password" className="form-control" placeholder="Enter your password" required />
                </div>
                <div className="form-check">
                  <input type="checkbox" id="rememberMe" className="form-check-input" />
                  <label htmlFor="rememberMe">Remember me</label>
                </div>
                <button type="submit" className="btn" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              {/* Alternative Login */}
              <div className="alt-login">
                <p>Or continue with</p>
                <div className="alt-buttons">
                  <button className="btn-outline">Google</button>
                </div>
              </div>

              {/* Register Prompt */}
              <div className="register-prompt">
                <p>
                  Don&apos;t have an account?{' '}
                  <span onClick={() => navigate('/register')} style={{ cursor: 'pointer', color: '#4361ee' }}>
                    Register now
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="section">
          <h2 className="text-center">Benefits of Having an Account</h2>
          <div className="about-section">
            <p>
              With a SkillShare Hub account, you can access personalized learning recommendations, track progress,
              save favorites, and connect with others.
            </p>
            <div className="about-grid">
              <div className="about-item">Personalized Dashboard</div>
              <div className="about-item">Progress Tracking</div>
              <div className="about-item">Course Recommendations</div>
              <div className="about-item">Learning Community</div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="section">
          <h2 className="text-center">What Our Users Say</h2>
          <div className="testimonials">
            <div className="testimonial-card">
              <h3>Easy Access to All My Courses</h3>
              <p>"Logging in is quick and seamless. I can easily access all my courses."</p>
              <p>— Michael Chen, Student</p>
            </div>
            <div className="testimonial-card">
              <h3>Everything in One Place</h3>
              <p>"My dashboard gives me a complete overview of my learning progress."</p>
              <p>— Jessica Williams, Student</p>
            </div>
            <div className="testimonial-card">
              <h3>Simple and Secure</h3>
              <p>"I appreciate the security measures while keeping login easy."</p>
              <p>— David Kim, Instructor</p>
            </div>
            <div className="testimonial-card">
              <h3>Accessible Anywhere</h3>
              <p>"I can log in from any device and have immediate access."</p>
              <p>— Maria Rodriguez, Student</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
};

export default LoginPage;
