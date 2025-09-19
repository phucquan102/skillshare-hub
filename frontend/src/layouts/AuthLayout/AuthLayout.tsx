// src/layouts/AuthLayout/AuthLayout.tsx
import React from 'react';

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      {children}
    </div>
  );
};

export default AuthLayout;