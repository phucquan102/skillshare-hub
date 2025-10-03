import React, { useState, useEffect } from 'react';
import GoogleLoginButton from '../GoogleLoginButton';

interface LoginData {
  email: string;
  password: string;
}

interface FormProps {
  onSubmit: (data: LoginData) => Promise<void>;
  onRegister?: () => void;
  isLoading?: boolean;
}

const LoginForm: React.FC<FormProps> = ({ onSubmit, onRegister, isLoading = false }) => {
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Partial<LoginData>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setDebugInfo(`API Base: ${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}`);
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginData> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

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
        const errorMsg = error.message || 'Login failed. Please try again.';
        setServerError(errorMsg);
        if (process.env.NODE_ENV === 'development') {
          setServerError(`${errorMsg} (Check console for details)`);
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name as keyof LoginData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handleGoogleSuccess = () => {
    console.log('Google login successful');
    setIsGoogleLoading(false);
  };

  const handleGoogleError = (error: string) => {
    setServerError(error);
    setIsGoogleLoading(false);
  };

  const handleGoogleStart = () => {
    setIsGoogleLoading(true);
    setServerError(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Login to Your Account</h3>
        <p className="text-gray-600">Welcome back!</p>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your email"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your password"
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              disabled={isLoading}
            />
            <span className="ml-2 text-sm text-gray-600">Remember me</span>
          </label>
          
<a 
  href="/forgot-password" 
  className="text-sm text-purple-600 hover:text-purple-800 font-medium"
  onClick={(e) => {
    e.preventDefault();
    // You can navigate programmatically or use Link from react-router-dom
    window.location.href = '/forgot-password';
  }}
>
  Forgot password?
</a>
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
          {isLoading ? 'Processing...' : 'Login'}
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
          Don’t have an account?{' '}
          <button
            onClick={onRegister}
            className="text-purple-600 hover:text-purple-800 font-medium"
            disabled={isLoading || isGoogleLoading}
          >
            Register now
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
