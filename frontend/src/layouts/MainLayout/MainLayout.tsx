import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Footer from '../../components/common/Footer/Footer';

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-6 py-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;