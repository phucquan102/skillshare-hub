// src/components/auth/RegisterForm/RegisterForm.tsx
import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setDebugInfo(`API Base: ${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}`);
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterData> = {};
    if (!formData.email) newErrors.email = 'Email là bắt buộc';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    if (!formData.password) newErrors.password = 'Mật khẩu là bắt buộc';
    if (!formData.fullName) newErrors.fullName = 'Họ tên là bắt buộc';
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
        const errorMsg = error.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        setServerError(errorMsg);
        if (process.env.NODE_ENV === 'development') {
          setServerError(`${errorMsg} (Xem console để biết chi tiết)`);
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

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Đăng ký tài khoản</h3>
        <p className="text-gray-600">Tham gia EduPress ngay hôm nay!</p>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Họ tên</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
              errors.fullName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập họ tên của bạn"
            disabled={isLoading}
          />
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ email</label>
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
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
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
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors border-gray-300"
            disabled={isLoading}
          >
            <option value="student">Học viên</option>
            <option value="instructor">Giảng viên</option>
          </select>
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
          {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600">
          Đã có tài khoản?{' '}
          <button
            onClick={onLogin}
            className="text-purple-600 hover:text-purple-800 font-medium"
          >
            Đăng nhập ngay
          </button>
        </p>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
          <p className="font-semibold">Thông tin gỡ lỗi:</p>
          <p>API Base: {process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}</p>
          <p>Endpoint: /api/users/register</p>
        </div>
      )}
    </div>
  );
};

export default RegisterForm;