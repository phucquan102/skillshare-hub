import React from "react";

const Header: React.FC = () => {
  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
          <span className="font-bold text-lg">EduPress</span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex gap-6 text-gray-700 font-medium">
          <a href="#" className="hover:text-orange-500">Home</a>
          <a href="#" className="hover:text-orange-500">Courses</a>
          <a href="#" className="hover:text-orange-500">Blog</a>
          <a href="#" className="hover:text-orange-500">About</a>
          <a href="#" className="hover:text-orange-500">Contact</a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button className="hidden md:inline px-4 py-2 text-sm border rounded hover:bg-gray-100">
            Login
          </button>
          <button className="px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600">
            Register
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
