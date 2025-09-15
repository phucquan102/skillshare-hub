import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading">Đang kiểm tra quyền truy cập...</div>;
  }

  // Kiểm tra nếu user đã đăng nhập và có role là admin
  if (!user) {
    // Chuyển hướng đến trang login và lưu trữ location hiện tại
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (user.role !== 'admin') {
    return <div className="error">Bạn không có quyền truy cập trang quản trị</div>;
  }

  return <>{children}</>;
};

export default AdminRoute;