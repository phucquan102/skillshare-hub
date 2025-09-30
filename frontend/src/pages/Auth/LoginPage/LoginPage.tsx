// src/pages/auth/LoginPage/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import './LoginPage.css';

interface LoginData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (data: LoginData) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err?.response?.data?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };
const handleGoogleSuccess = async (credentialResponse: any) => {
    setError(null);
    try {
      // Gửi credential (token) lên backend để xác thực
     const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/users/google`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: credentialResponse.credential }),
});

      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        // Cập nhật user trong AuthContext nếu cần
        navigate('/dashboard');
      } else {
        setError('Google login failed.');
      }
    } catch (error) {
      setError('Google login failed.');
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed.');
  };
return (
    <div className="max-w-6xl mx-auto px-6 py-4 bg-white rounded-lg shadow-lg">
      {/* Intro Section */}
      <div className="py-6 border-b border-gray-200 text-center">
        <h2 className="text-2xl font-bold text-[#3a0ca3] mb-2">Welcome Back to SkillShare Hub</h2>
        <p className="text-gray-600">
          Sign in to continue your learning journey and access your personalized dashboard
        </p>
      </div>

      {/* Login Container */}
      <div className="py-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Welcome */}
          <div className="flex flex-col justify-center">
            <h2 className="text-xl font-semibold text-[#3a0ca3] mb-4">Continue Your Learning Journey</h2>
            <p className="text-gray-600 mb-4">Access your courses, track progress, and connect with instructors.</p>
            <ul className="list-disc list-inside text-gray-600">
              <li>Access your purchased courses</li>
              <li>View upcoming sessions</li>
              <li>Track your learning progress</li>
              <li>Connect with instructors</li>
            </ul>
          </div>

          {/* Right: Login Form */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <h3 className="text-lg font-semibold text-[#3a0ca3] mb-4">Login to Your Account</h3>
              {error && (
                <div className="bg-red-100 border border-red-600 text-red-600 p-4 rounded-md mb-4">
                  {error}
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
                  const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
                  handleLogin({ email, password });
                }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#3a0ca3] mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4361ee] focus:border-[#4361ee]"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#3a0ca3] mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4361ee] focus:border-[#4361ee]"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <div className="mb-4 flex items-center">
                  <input type="checkbox" id="rememberMe" className="mr-2" />
                  <label htmlFor="rememberMe" className="text-sm text-gray-600">Remember me</label>
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-[#4361ee] text-white rounded hover:bg-[#3a0ca3] transition disabled:bg-gray-400"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              {/* Alternative Login */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 mb-2">Or continue with</p>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                  auto_select
                />
              </div>

              {/* Register Prompt */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <span
                    onClick={() => navigate('/register')}
                    className="text-[#4361ee] cursor-pointer hover:underline"
                  >
                    Register now
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="py-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-[#3a0ca3] mb-4 text-center">Benefits of Having an Account</h2>
        <p className="text-gray-600 mb-4 text-center">
          With a SkillShare Hub account, you can access personalized learning recommendations, track progress, save favorites, and connect with others.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-200 p-4 rounded-md text-center">
            <p className="text-lg font-semibold text-[#3a0ca3]">Personalized Dashboard</p>
          </div>
          <div className="bg-gray-200 p-4 rounded-md text-center">
            <p className="text-lg font-semibold text-[#3a0ca3]">Progress Tracking</p>
          </div>
          <div className="bg-gray-200 p-4 rounded-md text-center">
            <p className="text-lg font-semibold text-[#3a0ca3]">Course Recommendations</p>
          </div>
          <div className="bg-gray-200 p-4 rounded-md text-center">
            <p className="text-lg font-semibold text-[#3a0ca3]">Learning Community</p>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-6">
        <h2 className="text-2xl font-bold text-[#3a0ca3] mb-4 text-center">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-200 p-4 rounded-md">
            <h3 className="text-lg font-semibold text-[#3a0ca3] mb-2">Easy Access to All My Courses</h3>
            <p className="text-sm text-gray-600 mb-2">"Logging in is quick and seamless. I can easily access all my courses."</p>
            <p className="text-sm text-gray-600">— Michael Chen, Student</p>
          </div>
          <div className="bg-gray-200 p-4 rounded-md">
            <h3 className="text-lg font-semibold text-[#3a0ca3] mb-2">Everything in One Place</h3>
            <p className="text-sm text-gray-600 mb-2">"My dashboard gives me a complete overview of my learning progress."</p>
            <p className="text-sm text-gray-600">— Jessica Williams, Student</p>
          </div>
          <div className="bg-gray-200 p-4 rounded-md">
            <h3 className="text-lg font-semibold text-[#3a0ca3] mb-2">Simple and Secure</h3>
            <p className="text-sm text-gray-600 mb-2">"I appreciate the security measures while keeping login easy."</p>
            <p className="text-sm text-gray-600">— David Kim, Instructor</p>
          </div>
          <div className="bg-gray-200 p-4 rounded-md">
            <h3 className="text-lg font-semibold text-[#3a0ca3] mb-2">Accessible Anywhere</h3>
            <p className="text-sm text-gray-600 mb-2">"I can log in from any device and have immediate access."</p>
            <p className="text-sm text-gray-600">— Maria Rodriguez, Student</p>
          </div>
        </div>
      </div>
    </div>
 
);
};

export default LoginPage;
