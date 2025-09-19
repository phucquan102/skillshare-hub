import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setDebugInfo(`API Base: ${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}`);
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginData> = {};

    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
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
        const errorMsg = error.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
        setServerError(errorMsg);
        if (process.env.NODE_ENV === 'development') {
          setServerError(`${errorMsg} (Xem console để biết chi tiết)`);
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

  const handleSocialLogin = (provider: string) => {
    console.log(`Đăng nhập với ${provider}`);
    // Implement social login logic here
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Đăng nhập tài khoản</h3>
        <p className="text-gray-600">Chào mừng bạn trở lại!</p>
      </div>

      {serverError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {serverError}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs">
              <p>Thông tin gỡ lỗi: {debugInfo}</p>
              <p>Kiểm tra console để biết thêm chi tiết</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Địa chỉ email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập email của bạn"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mật khẩu
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập mật khẩu"
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
            <span className="ml-2 text-sm text-gray-600">Ghi nhớ đăng nhập</span>
          </label>
          <a href="#" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
            Quên mật khẩu?
          </a>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg transform hover:-translate-y-0.5'
          }`}
        >
          {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
      </div>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Hoặc tiếp tục với</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => handleSocialLogin('Google')}
            className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            <span>Google</span>
          </button>
          <button
            onClick={() => handleSocialLogin('Facebook')}
            className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            <span>Facebook</span>
          </button>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600">
          Chưa có tài khoản?{' '}
          <button
            onClick={onRegister}
            className="text-purple-600 hover:text-purple-800 font-medium"
          >
            Đăng ký ngay
          </button>
        </p>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
          <p className="font-semibold">Thông tin gỡ lỗi:</p>
          <p>API Base: {process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}</p>
          <p>Endpoint: /api/users/login</p>
        </div>
      )}
    </div>
  );
};

export default LoginForm;