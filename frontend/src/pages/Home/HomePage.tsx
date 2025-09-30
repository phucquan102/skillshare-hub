import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-5xl font-extrabold text-red-600 underline mb-6">
        Welcome to SkillShare Hub
      </h1>
      <p className="bg-yellow-200 text-red-600 p-6 rounded-lg shadow-lg mb-8">
        Browse through our extensive catalog of courses in various categories and find the perfect learning opportunity for you.
      </p>
      <div className="text-center">
        <Link
          to="/courses"
          className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
        >
          Explore Our Courses
        </Link>
      </div>
    </main>
  );
};

export default HomePage;