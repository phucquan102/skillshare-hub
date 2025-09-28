import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const navigationItems = [
    { path: 'dashboard', label: 'Dashboard', icon: '📊' },
    { path: 'users', label: 'User Management', icon: '👥' },
    { path: 'courses', label: 'Course Management', icon: '📚' },
    { path: 'reports', label: 'Reports', icon: '📈' },
  ];

  const isActivePath = (path: string) => {
    return location.pathname.endsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-gradient-to-b from-[#3a0ca3] to-[#4361ee] text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/20">
          <h2 className={`font-bold text-lg ${!sidebarOpen && 'hidden'}`}>
            Admin Panel
          </h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white hover:text-yellow-300"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-4 space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2 rounded-md transition ${
                isActivePath(item.path)
                  ? 'bg-white text-[#3a0ca3] font-semibold'
                  : 'hover:bg-white/10'
              }`}
            >
              <span>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/20">
          <Link
            to="/"
            className="text-sm hover:underline hover:text-yellow-300 block"
          >
            ← Back to main site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6 border-b pb-3">
          <h1 className="text-2xl font-bold text-[#3a0ca3]">
            System Administration
          </h1>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
