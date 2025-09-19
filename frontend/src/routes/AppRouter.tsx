// src/routes/AppRouter.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminRoute from './AdminRoute';
import AdminLayout from '../layouts/AdminLayout/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard/AdminDashboard';
import UsersManagementPage from '../pages/admin/UsersManagement/UsersManagementPage';
import CoursesManagementPage from '../pages/admin/CoursesManagement/CoursesManagementPage';
import ReportsPage from '../pages/admin/ReportsPage/ReportsPage';
import HomePage from '../pages/Home/HomePage';
import LoginPage from '../pages/Auth/LoginPage/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage/RegisterPage';

const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin Routes - tất cả bắt đầu bằng /admin */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UsersManagementPage />} />
        <Route path="courses" element={<CoursesManagementPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;