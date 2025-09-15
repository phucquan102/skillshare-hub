import React, { useState, useRef, useEffect } from 'react';

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: 'student' | 'instructor';
}

interface FormProps {
  onSubmit: (data: Omit<RegisterData, 'confirmPassword'>) => Promise<void>;
  isLoading?: boolean;
}

const RegisterForm: React.FC<FormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'student'
  });
  const [errors, setErrors] = useState<Partial<RegisterData & { terms?: string }>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const termsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Hiển thị thông tin debug trong môi trường development
    if (process.env.NODE_ENV === 'development') {
      setDebugInfo(`API Base: ${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}`);
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterData & { terms?: string }> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    }

    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (!termsRef.current?.checked) {
      newErrors.terms = 'Bạn phải đồng ý với Điều khoản sử dụng và Chính sách bảo mật';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    
    console.log('Form submit triggered');
    
    if (validateForm()) {
      console.log('Validation passed, submitting data:', {
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role
      });
      
      try {
        const { confirmPassword, ...submitData } = formData;
        await onSubmit(submitData);
      } catch (error: any) {
        console.error('Registration error:', error);
        const errorMsg = error.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        setServerError(errorMsg);
        
        // Hiển thị thông tin gỡ lỗi trong môi trường development
        if (process.env.NODE_ENV === 'development') {
          setServerError(`${errorMsg} (Xem console để biết chi tiết)`);
        }
      }
    } else {
      console.log('Validation failed, errors:', errors);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear corresponding error
    if (errors[name as keyof RegisterData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear server error
    if (serverError) {
      setServerError(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Đăng ký</h2>
        <p className="text-gray-600 mt-2">Tạo tài khoản mới để bắt đầu học tập</p>
      </div>

      {serverError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {serverError}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs">
              <p>Thông tin gỡ lỗi: {debugInfo}</p>
              <p>Kiểm tra console để biết thêm chi tiết</p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập họ và tên"
              disabled={isLoading}
            />
            {errors.fullName && (
              <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vai trò
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={isLoading}
            >
              <option value="student">Học viên</option>
              <option value="instructor">Giảng viên</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập lại mật khẩu"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <div>
            <div className="flex items-start">
              <input
                ref={termsRef}
                type="checkbox"
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 mt-1"
                disabled={isLoading}
              />
              <label className="ml-2 text-sm text-gray-600">
                Tôi đồng ý với{' '}
                <a href="#" className="text-orange-500 hover:text-orange-600">
                  Điều khoản sử dụng
                </a>{' '}
                và{' '}
                <a href="#" className="text-orange-500 hover:text-orange-600">
                  Chính sách bảo mật
                </a>
              </label>
            </div>
            {errors.terms && (
              <p className="text-red-500 text-sm mt-1">{errors.terms}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
            }`}
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Đã có tài khoản?{' '}
          <a href="#" className="text-orange-500 hover:text-orange-600 font-medium">
            Đăng nhập ngay
          </a>
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