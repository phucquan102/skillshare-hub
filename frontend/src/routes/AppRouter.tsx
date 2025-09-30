import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminRoute from './AdminRoute';
import MainLayout from '../layouts/MainLayout/MainLayout';
import AdminLayout from '../layouts/AdminLayout/AdminLayout';
import AdminDashboard from '../components/admin/Dashboard/AdminDashboard';
import UsersManagementPage from '../pages/admin/UsersManagement/UsersManagementPage';
import CoursesManagementPage from '../pages/admin/CoursesManagement/CoursesManagementPage';
import HomePage from '../pages/Home/HomePage';
import LoginPage from '../pages/Auth/LoginPage/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage/RegisterPage';
import CreateCoursePage from '../pages/Courses/CreateCoursePage/CreateCoursePage';
import CoursesPage from '../pages/Courses/CoursesPage';
import CourseDetailPage from '../pages/Courses/CourseDetailPage/CourseDetailPage';
import CheckoutPage from '../pages/payment/CheckoutPage';
import PaymentSuccess from '../pages/payment/PaymentSuccess/PaymentSuccess';

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/payment/checkout" element={<CheckoutPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
      </Route>

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
        <Route path="courses">
          <Route index element={<CoursesManagementPage />} />
          <Route path="create" element={<CreateCoursePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;