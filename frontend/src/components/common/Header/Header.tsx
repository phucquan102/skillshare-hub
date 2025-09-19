// src/components/common/Header/Header.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
<header className="w-full bg-white shadow-md">
  <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-[#3a0ca3]">
    {/* Logo */}
    <div className="flex items-center gap-2">
      <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
      <span className="font-bold text-lg">SkillShare Hub</span>
    </div>

    {/* Navigation */}
    <nav className="hidden md:flex gap-6 font-medium">
      <Link to="/" className="hover:text-[#4361ee] transition">Home</Link>
      <Link to="/courses" className="hover:text-[#4361ee] transition">Courses</Link>
      <Link to="/instructors" className="hover:text-[#4361ee] transition">Instructors</Link>
      <Link to="/about" className="hover:text-[#4361ee] transition">About Us</Link>
      <Link to="/contact" className="hover:text-[#4361ee] transition">Contact</Link>
    </nav>

    {/* Actions */}
    <div className="flex items-center gap-4">
      {user ? (
        <>
          <span className="text-sm">
            Xin chào, {user.fullName || user.email}
          </span>
          {user.role === 'admin' && (
            <Link 
              to="/admin/dashboard" 
              className="px-4 py-2 text-sm bg-yellow-400 text-black rounded hover:bg-yellow-500 transition"
            >
              Admin Panel
            </Link>
          )}
          <button
            onClick={logout}
            className="px-4 py-2 text-sm border border-[#3a0ca3] text-[#3a0ca3] rounded hover:bg-[#f5f7fb] transition"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => navigate('/login')}
            className="hidden md:inline px-4 py-2 text-sm border border-[#3a0ca3] text-[#3a0ca3] rounded hover:bg-[#f5f7fb] transition"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-2 text-sm bg-[#f5f7fb] text-[#3a0ca3] rounded hover:bg-[#e9ecf5] transition"
          >
            Register
          </button>
        </>
      )}
    </div>
  </div>
</header>


  );
};

export default Header;