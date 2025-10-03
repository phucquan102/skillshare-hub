import React, { useState, useEffect } from 'react';
import GoogleLoginButton from '../GoogleLoginButton';

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'instructor';
}

interface FormProps {
  onSubmit: (data: RegisterData) => Promise<void>;
  onLogin?: () => void;
  isLoading?: boolean;
}

const RegisterForm: React.FC<FormProps> = ({ onSubmit, onLogin, isLoading = false }) => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    fullName: '',
    role: 'student',
  });
  const [errors, setErrors] = useState<Partial<RegisterData>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setDebugInfo(`API Base: ${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}`);
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterData> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (validateForm()) {
      try {
        await onSubmit(formData);
      } catch (error: any) {
        const errorMsg = error.message || 'Registration failed. Please try again.';
        setServerError(errorMsg);
        if (process.env.NODE_ENV === 'development') {
          setServerError(`${errorMsg} (Check console for details)`);
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof RegisterData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError(null);
  };

  const handleGoogleSuccess = () => {
    console.log('Google registration successful');
    setIsGoogleLoading(false);
  };

  const handleGoogleError = (error: string) => {
    setServerError(error);
    setIsGoogleLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Create an Account</h3>
        <p className="text-gray-600">Join EduPress today!</p>
      </div>

      {serverError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {serverError}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs">
              <p>Debug info: {debugInfo}</p>
              <p>Check console for more details</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
              errors.fullName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
            disabled={isLoading || isGoogleLoading}
          />
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your email"
            disabled={isLoading || isGoogleLoading}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your password"
            disabled={isLoading || isGoogleLoading}
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors border-gray-300"
            disabled={isLoading || isGoogleLoading}
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || isGoogleLoading}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
            isLoading || isGoogleLoading
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg transform hover:-translate-y-0.5'
          }`}
        >
          {isLoading ? 'Processing...' : 'Register'}
        </button>
      </div>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <GoogleLoginButton 
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            isLoading={isGoogleLoading}
          />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onLogin}
            className="text-purple-600 hover:text-purple-800 font-medium"
            disabled={isLoading || isGoogleLoading}
          >
            Login now
          </button>
        </p>
      </div>

      {/* {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
          <p className="font-semibold">Debug Info:</p>
          <p>API Base: {process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}</p>
          <p>Endpoint: /api/users/register</p>
          <p>Google Client ID: {process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'Configured' : 'Not configured'}</p>
        </div>
      )} */}
    </div>
  );
};

export default RegisterForm;
