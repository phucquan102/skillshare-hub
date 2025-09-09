import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 mt-20 pt-12 pb-6">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-gray-700">
        {/* Logo + Intro */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="w-6 h-6" />
            <span className="font-bold text-lg">EduPress</span>
          </div>
          <p>
            LearnPress is a WordPress LMS Plugin that helps you to create and sell courses online easily.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-orange-500">About Us</a></li>
            <li><a href="#" className="hover:text-orange-500">Courses</a></li>
            <li><a href="#" className="hover:text-orange-500">Blog</a></li>
            <li><a href="#" className="hover:text-orange-500">Contact</a></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-semibold mb-3">Support</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-orange-500">Help Center</a></li>
            <li><a href="#" className="hover:text-orange-500">Terms of Service</a></li>
            <li><a href="#" className="hover:text-orange-500">Privacy Policy</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-semibold mb-3">Subscribe</h4>
          <p className="mb-3">Get the latest updates and offers.</p>
          <form className="flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-3 py-2 border rounded-l focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-r hover:bg-orange-600"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-10 border-t pt-4 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} EduPress. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
