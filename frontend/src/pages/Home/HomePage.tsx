import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import CourseList from './../../components/course/CourseList/CourseList';
import { useChatContext } from '../../context/ChatContext';
import AIChatComponent from '../../components/chat/AIChatComponent';
import apiConfig from '../../services/api/apiConfig';
import { useAuth } from '../../context/AuthContext';

const HomePage: React.FC = () => {
  const { categories, loading, error } = useCategories();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const { user } = useAuth();
  
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const displayedCategories = showAllCategories ? categories : categories.slice(0, 6);

  /**
   * 🎯 Tạo conversation AI khi user click mở chat
   */
  const handleOpenChat = async () => {
    if (conversationId) {
      // Nếu đã có conversation ID, chỉ mở chat
      setIsChatOpen(true);
      return;
    }

    // Tạo conversation mới
    try {
      setChatLoading(true);
      setChatError(null);
      
      const response = await apiConfig.post('/chat/conversations', {
        type: 'direct',
        title: `AI Chat - ${new Date().toLocaleDateString('vi-VN')}`
      });
      
      setConversationId(response.data.conversation._id);
      setIsChatOpen(true);
    } catch (err) {
      console.error('❌ Error creating conversation:', err);
      setChatError('Không thể tạo phòng chat. Vui lòng thử lại!');
    } finally {
      setChatLoading(false);
    }
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      {/* ================== PAGE CONTENT ================== */}
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-green-800 text-white py-20">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-5xl font-bold mb-6">Connect Knowledge, Spark Creativity</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              SkillShare Hub is a platform connecting instructors and students, delivering the best online learning experience
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/courses"
                className="px-8 py-3 bg-white text-green-800 rounded-md hover:bg-green-100 transition font-semibold"
              >
                Explore Courses
              </Link>
              <Link
                to="/become-instructor"
                className="px-8 py-3 bg-transparent border-2 border-white rounded-md hover:bg-white hover:text-green-800 transition font-semibold"
              >
                Become an Instructor
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-green-800 mb-12">
              Why Choose SkillShare Hub?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-lg border border-green-200 hover:shadow-lg transition">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👨‍🏫</span>
                </div>
                <h3 className="text-xl font-semibold text-green-800 mb-3">
                  Learn from Top Instructors
                </h3>
                <p className="text-gray-600">Access experienced instructors with proven expertise</p>
              </div>
              <div className="text-center p-6 rounded-lg border border-green-200 hover:shadow-lg transition">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⏰</span>
                </div>
                <h3 className="text-xl font-semibold text-green-800 mb-3">
                  Flexible Learning Schedule
                </h3>
                <p className="text-gray-600">
                  Study at your own pace with flexible time arrangements
                </p>
              </div>
              <div className="text-center p-6 rounded-lg border border-green-200 hover:shadow-lg transition">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📚</span>
                </div>
                <h3 className="text-xl font-semibold text-green-800 mb-3">
                  Diverse Course Catalog
                </h3>
                <p className="text-gray-600">
                  Hundreds of high-quality courses across various fields
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 bg-green-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-green-800 mb-12">
              Browse Categories
            </h2>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">Failed to load categories</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  Retry
                </button>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No categories available yet</p>
                <Link
                  to="/courses"
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  Browse All Courses
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedCategories.map((category) => (
                    <Link
                      key={category.key}
                      to={`/courses?category=${category.key}`}
                      className="group"
                    >
                      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                        <div className="h-40 relative overflow-hidden">
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all duration-300"></div>
                          <div className="absolute top-4 left-4 w-12 h-12 bg-white bg-opacity-90 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">{category.icon}</span>
                          </div>
                          {category.courseCount !== undefined &&
                            category.courseCount > 0 && (
                              <div className="absolute top-4 right-4 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                {category.courseCount}{' '}
                                {category.courseCount === 1 ? 'course' : 'courses'}
                              </div>
                            )}
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          <h3 className="text-xl font-semibold text-green-800 mb-2 group-hover:text-green-600 transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-gray-600 mb-4 text-sm flex-1">
                            {category.description}
                          </p>
                          <div className="flex items-center text-green-600 font-semibold text-sm group-hover:text-green-700 transition-colors mt-auto">
                            Explore Courses
                            <span className="ml-2 group-hover:translate-x-1 transition-transform">
                              →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Show More/Less Button */}
                {categories.length > 6 && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                    >
                      {showAllCategories
                        ? 'Show Less Categories'
                        : `Show All ${categories.length} Categories`}
                    </button>
                  </div>
                )}

                <div className="text-center mt-12">
                  <Link
                    to="/courses"
                    className="inline-flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-md hover:shadow-lg"
                  >
                    View All Courses
                    <span className="ml-2">→</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Featured Courses Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-green-800 mb-12">
              Featured Courses
            </h2>
            <div className="bg-green-50 rounded-lg p-6">
              <CourseList
                initialFilters={{
                  page: 1,
                  limit: 6,
                  status: 'published',
                }}
              />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-green-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-green-800 mb-12">
              What Our Students Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg border border-green-200 shadow-sm">
                <p className="text-gray-600 mb-4">
                  "SkillShare Hub has transformed my career. The courses are
                  well-structured and the instructors are very supportive."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center mr-4">
                    <span className="text-lg">😊</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">
                      Nguyen Minh Anh
                    </h4>
                    <p className="text-gray-500">Web Development Student</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-green-200 shadow-sm">
                <p className="text-gray-600 mb-4">
                  "I never thought online learning could be this engaging. The
                  platform is user-friendly and the community is amazing."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center mr-4">
                    <span className="text-lg">👍</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">
                      Tran Quoc Bao
                    </h4>
                    <p className="text-gray-500">Graphic Design Student</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-green-700 text-white">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-xl mb-8">
              Sign up now and don't miss out on our exciting courses
            </p>
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-green-800 rounded-md hover:bg-green-100 transition font-semibold"
            >
              Create an Account
            </Link>
          </div>
        </section>
      </main>

      {/* ================== FLOATING AI CHAT WIDGET ================== */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
        {/* Chat Panel */}
        {isChatOpen && conversationId && (
          <div className="w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-slideUp">
            {/* Minimal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🤖</span>
                <span className="text-sm font-semibold">AI Assistant</span>
              </div>
              <button
                onClick={handleCloseChat}
                className="hover:bg-green-500 rounded-full p-1 transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat Component */}
            <div className="flex-1 overflow-hidden">
              <AIChatComponent conversationId={conversationId} />
            </div>
          </div>
        )}

        {/* Floating Button */}
        {!isChatOpen && (
          <button
            onClick={handleOpenChat}
            disabled={chatLoading}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-full shadow-lg px-5 py-3 flex items-center space-x-2 transition-all hover:shadow-xl active:scale-95 border border-green-700 disabled:opacity-50"
            aria-label="Open AI chat"
          >
            {chatLoading ? (
              <>
                <span className="animate-spin text-lg">⏳</span>
                <span className="text-sm font-semibold">Đang tạo...</span>
              </>
            ) : (
              <>
                <span className="text-xl">💬</span>
                <span className="text-sm font-semibold">Chat with AI</span>
              </>
            )}
          </button>
        )}

        {/* Error Message */}
        {chatError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
            {chatError}
            <button
              onClick={() => setChatError(null)}
              className="ml-2 underline hover:no-underline"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default HomePage;