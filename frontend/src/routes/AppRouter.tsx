// src/AppRouter.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminRoute from '../routes/AdminRoute';
import PrivateRoute from '../components/common/PrivateRoute/PrivateRoute';
import MainLayout from '../layouts/MainLayout/MainLayout';
import AdminLayout from '../layouts/AdminLayout/AdminLayout';
import DashboardLayout from './../layouts/DashboardLayout/DashboardLayout';
import InstructorLayout from '../layouts/InstructorLayout/InstructorLayout';  
import AdminDashboard from '../pages/admin/AdminDashboard/AdminDashboardPage';  
import UsersManagementPage from '../pages/admin/UsersManagement/UsersManagementPage';
import CoursesManagementPage from '../pages/admin/CoursesManagement/CoursesManagementPage';
import HomePage from '../pages/Home/HomePage';
import LoginPage from '../pages/Auth/LoginPage/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage/RegisterPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import InstructorDashboardPage from '../pages/instructor/InstructorDashboardPage';  
import ProfilePage from '../pages/Auth/ProfilePage/ProfilePage';
import CreateCoursePage from '../pages/Courses/CreateCoursePage/CreateCoursePage';
import CoursesPage from '../pages/Courses/CoursesPage';
import CourseDetailPage from '../pages/Courses/CourseDetailPage/CourseDetailPage';
import CheckoutPage from '../pages/payment/CheckoutPage';
import PaymentSuccess from '../pages/payment/PaymentSuccess/PaymentSuccess';
import ForgotPasswordPage from '../pages/Auth/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from '../pages/Auth/ResetPasswordPage/ResetPasswordPage';
import EmailVerificationPage from '../pages/Auth/EmailVerificationPage/EmailVerificationPage';

const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/payment/checkout" element={<CheckoutPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
      </Route>

      {/* Student Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="courses" element={<div>My Courses Page</div>} />
        <Route path="sessions" element={<div>Upcoming Sessions Page</div>} />
        <Route path="schedule" element={<div>Learning Schedule Page</div>} />
        <Route path="payments" element={<div>Payment History Page</div>} />
      </Route>

      {/* Instructor Dashboard Routes */}
      <Route
        path="/instructor"
        element={
          <PrivateRoute>
            <InstructorLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<InstructorDashboardPage />} />
        <Route path="courses" element={<div>Instructor Courses Page</div>} />
        <Route path="sessions" element={<div>Session Management Page</div>} />
        <Route path="students" element={<div>Students List Page</div>} />
        <Route path="earnings" element={<div>Earnings & Payments Page</div>} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Routes - CHỈ CÓ 1 ROUTE DUY NHẤT */}
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
        <Route path="profile" element={<ProfilePage />} />
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
