import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiBook, 
  FiBarChart2, 
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiUser,
  FiMessageSquare // 🆕 THÊM ICON CHAT
} from 'react-icons/fi';
import { HiOutlineShieldCheck, HiOutlineCog } from 'react-icons/hi';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const navigationItems = [
    { path: 'dashboard', label: 'Dashboard', icon: <FiHome className="w-5 h-5" /> },
    { path: 'users', label: 'User Management', icon: <FiUsers className="w-5 h-5" /> },
    { path: 'courses', label: 'Course Management', icon: <FiBook className="w-5 h-5" /> },
    { path: 'chat', label: 'Messages', icon: <FiMessageSquare className="w-5 h-5" /> }, // 🆕 THÊM CHAT
    { path: 'reports', label: 'Analytics & Reports', icon: <FiBarChart2 className="w-5 h-5" /> },
    { path: 'settings', label: 'System Settings', icon: <HiOutlineCog className="w-5 h-5" /> },
  ];

  const isActivePath = (path: string) => {
    return location.pathname.includes(`/admin/${path}`);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-gradient-to-b from-emerald-600 to-green-600 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-80' : 'w-20'
        } relative z-10 shadow-2xl`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-emerald-500/30">
          <div className={`flex items-center gap-3 transition-all ${!sidebarOpen && 'opacity-0 scale-95'}`}>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <HiOutlineShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Admin Panel</h2>
              <p className="text-emerald-100 text-sm">System Administration</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-110"
          >
            {sidebarOpen ? 
              <FiChevronLeft className="w-5 h-5 text-white" /> : 
              <FiChevronRight className="w-5 h-5 text-white" />
            }
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6 space-y-2 px-4">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                isActivePath(item.path)
                  ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                  : 'hover:bg-white/10 text-emerald-100'
              } ${!sidebarOpen && 'justify-center'}`}
            >
              <div className={`${isActivePath(item.path) ? 'text-white' : 'text-emerald-200'} group-hover:scale-110 transition-transform duration-200`}>
                {item.icon}
              </div>
              {sidebarOpen && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
              {!sidebarOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section & Footer */}
        <div className="p-4 border-t border-emerald-500/30 space-y-4">
          {/* User Info */}
          <div className={`flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-sm ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <FiUser className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">Administrator</p>
                <p className="text-emerald-200 text-xs truncate">admin@skillsharehub.com</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={`space-y-2 ${!sidebarOpen && 'flex flex-col items-center'}`}>
            <Link
              to="/"
              className={`flex items-center gap-3 px-3 py-2 text-emerald-100 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 ${
                !sidebarOpen && 'justify-center'
              }`}
            >
              <FiLogOut className="w-4 h-4" />
              {sidebarOpen && <span className="text-sm">Back to Main Site</span>}
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-10">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent">
                  System Administration
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Manage your platform and monitor system performance
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-2xl px-4 py-2 border border-gray-200/40">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Admin User</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20">
            <Outlet />
          </div>

          {/* Quick Stats Footer */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-gradient-to-br from-emerald-500 to-green-500 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Total Users</p>
                  <p className="text-2xl font-bold mt-1">2,847</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FiUsers className="w-6 h-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-500 to-green-500 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Active Courses</p>
                  <p className="text-2xl font-bold mt-1">156</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FiBook className="w-6 h-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-500 to-green-500 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Revenue</p>
                  <p className="text-2xl font-bold mt-1">$24.5K</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FiBarChart2 className="w-6 h-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-500 to-green-500 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">System Health</p>
                  <p className="text-2xl font-bold mt-1">99.9%</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <HiOutlineShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;