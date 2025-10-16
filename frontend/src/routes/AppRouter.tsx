// frontend/src/routes/AppRouter.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminRoute from '../routes/AdminRoute';
import PrivateRoute from '../components/common/PrivateRoute/PrivateRoute';

// Layouts
import MainLayout from '../layouts/MainLayout/MainLayout';
import AdminLayout from '../layouts/AdminLayout/AdminLayout';
import DashboardLayout from './../layouts/DashboardLayout/DashboardLayout';
import InstructorLayout from '../layouts/InstructorLayout/InstructorLayout';  

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard/AdminDashboardPage';  
import UsersManagementPage from '../pages/admin/UsersManagement/UsersManagementPage';
import CoursesManagementPage from '../pages/admin/CoursesManagement/CoursesManagementPage';

// Public Pages
import HomePage from '../pages/Home/HomePage';
import LoginPage from '../pages/Auth/LoginPage/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage/RegisterPage';
import CoursesPage from '../pages/Courses/CoursesPage';
import CourseDetailPage from '../pages/Courses/CourseDetailPage/CourseDetailPage';
import CheckoutPage from '../pages/payment/CheckoutPage';
import PaymentSuccess from '../pages/payment/PaymentSuccess/PaymentSuccess';
import ForgotPasswordPage from '../pages/Auth/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from '../pages/Auth/ResetPasswordPage/ResetPasswordPage';
import EmailVerificationPage from '../pages/Auth/EmailVerificationPage/EmailVerificationPage';
import BecomeInstructorPage from '../pages/become-instructor/BecomeInstructorPage'; 

// Student Pages
import DashboardPage from '../pages/Dashboard/DashboardPage';
import ProfilePage from '../pages/Auth/ProfilePage/ProfilePage';
import LessonLivePage from '../pages/student/LessonLivePage/LessonLivePage';
import StudentLessonMeeting from '../pages/student/StudentLessonMeeting/StudentLessonMeeting';
import MyCoursesPage from '../pages/student/MyCoursesPage/MyCoursesPage';
import StudentLessonList from '../pages/student/StudentLessonList/StudentLessonList';
import StudentLessonDetail from '../pages/student/StudentLessonDetail/StudentLessonDetail'; // 🆕 Thêm import này

// Instructor Pages
import InstructorDashboardPage from '../pages/instructor/InstructorDashboardPage';  
import CreateCoursePage from '../pages/Courses/CreateCoursePage/CreateCoursePage';
import EditCoursePage from '../pages/instructor/EditCoursePage/EditCoursePage';
import ManageCoursesPage from '../pages/instructor/ManageCourses/ManageCoursesPage';
import ManageLessonsPage from '../pages/instructor/ManageLessons/ManageLessonsPage';
import LessonDetailPage from '../pages/instructor/ManageLessons/LessonDetailPage';
import InstructorLessonStartPage from '../pages/instructor/InstructorLessonStartPage/InstructorLessonStartPage';

const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* 🌐 Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/payment/checkout" element={<CheckoutPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/become-instructor" element={<BecomeInstructorPage />} /> 
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
      </Route>

      {/* 👨‍🎓 Student Dashboard */}
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
        {/* 🆕 My Courses Routes */}
        <Route path="courses">
          <Route index element={<MyCoursesPage />} />
          <Route path=":courseId" element={<StudentLessonList />} />
        </Route>
        <Route path="sessions" element={<div>Upcoming Sessions Page</div>} />
        <Route path="schedule" element={<div>Learning Schedule Page</div>} />
        <Route path="payments" element={<div>Payment History Page</div>} />
      </Route>

      {/* 👨‍🏫 Instructor Dashboard */}
      <Route
        path="/instructor"
        element={
          <PrivateRoute>
            <InstructorLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<InstructorDashboardPage />} />
        <Route path="courses" element={<ManageCoursesPage />} />
        <Route path="courses/create" element={<CreateCoursePage />} />
        <Route path="courses/edit/:courseId" element={<EditCoursePage />} />
        <Route path="courses/:courseId/lessons" element={<ManageLessonsPage />} />
        <Route path="courses/:courseId/lessons/create" element={<div>Create Lesson Page</div>} />
        <Route path="courses/:courseId/lessons/:lessonId" element={<LessonDetailPage />} />
        <Route path="courses/:courseId/lessons/:lessonId/edit" element={<div>Edit Lesson Page</div>} />

        {/* 🆕 Route mở buổi học */}
        <Route
          path="course/:courseId/lesson/:lessonId/start"
          element={
            <PrivateRoute>
              <InstructorLessonStartPage />
            </PrivateRoute>
          }
        />

        <Route path="sessions" element={<div>Session Management Page</div>} />
        <Route path="students" element={<div>Students List Page</div>} />
        <Route path="earnings" element={<div>Earnings & Payments Page</div>} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* 🆕 ONLINE LEARNING ROUTES - KHÔNG DÙNG LAYOUT */}
      <Route
        path="/course/:courseId/lesson/:lessonId/live"
        element={
          <PrivateRoute>
            <LessonLivePage />
          </PrivateRoute>
        }
      />
      
      <Route
        path="/student/course/:courseId/lesson/:lessonId/meeting"
        element={
          <PrivateRoute>
            <StudentLessonMeeting />
          </PrivateRoute>
        }
      />

      {/* 🆕 THÊM ROUTE CHO LESSON DETAIL */}
      <Route
        path="/student/lessons/:lessonId"
        element={
          <PrivateRoute>
            <StudentLessonDetail />
          </PrivateRoute>
        }
      />

      {/* 🛠 Admin */}
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
          <Route path="edit/:courseId" element={<EditCoursePage />} />
        </Route>
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;