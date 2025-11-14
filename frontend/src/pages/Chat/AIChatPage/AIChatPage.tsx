import React, { useEffect, useState } from 'react';
import AIChatComponent from '../../../components/chat/AIChatComponent';
import apiConfig from '../../../services/api/apiConfig';
import { useAuth } from '../../../context/AuthContext';

export const AIChatPage: React.FC = () => {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 🎯 Tạo conversation AI mới khi page load
   */
  useEffect(() => {
    const initializeAIChat = async () => {
      try {
        setLoading(true);
        const response = await apiConfig.post('/chat/conversations', {
          type: 'direct',
          title: `AI Chat - ${new Date().toLocaleDateString('vi-VN')}`
        });
        setConversationId(response.data.conversation._id);
        setError(null);
      } catch (err) {
        console.error('❌ Error creating conversation:', err);
        setError('Không thể tạo phòng chat. Vui lòng thử lại!');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      initializeAIChat();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mb-4"></div>
          </div>
          <p className="text-gray-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full border border-red-100">
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Lỗi</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center space-x-3">
          <span className="text-3xl">🤖</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">SkillShare AI Assistant</h1>
            <p className="text-sm text-gray-500">Tìm khóa học phù hợp với bạn</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Section - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex-shrink-0">
                <h2 className="text-lg font-semibold">💬 Chat với AI</h2>
                <p className="text-sm text-green-100 mt-1">Hỏi về các khóa học mà bạn quan tâm</p>
              </div>

              {/* Chat Content */}
              <div className="flex-1 overflow-hidden">
                {conversationId && (
                  <AIChatComponent conversationId={conversationId} />
                )}
              </div>
            </div>
          </div>

          {/* Info Section - Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Tips Card */}
            <div className="bg-white rounded-2xl shadow-md border border-blue-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">💡</span>
                <h3 className="text-lg font-semibold text-gray-800">Mẹo sử dụng</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2 text-sm">
                  <span className="text-green-600 font-bold mt-0.5">•</span>
                  <span className="text-gray-700">
                    <strong>Chủ đề:</strong> "Tôi muốn học Web Development"
                  </span>
                </li>
                <li className="flex items-start space-x-2 text-sm">
                  <span className="text-green-600 font-bold mt-0.5">•</span>
                  <span className="text-gray-700">
                    <strong>Mức độ:</strong> "Khóa học cho người mới bắt đầu"
                  </span>
                </li>
                <li className="flex items-start space-x-2 text-sm">
                  <span className="text-green-600 font-bold mt-0.5">•</span>
                  <span className="text-gray-700">
                    <strong>Giá:</strong> "Khóa học dưới $50"
                  </span>
                </li>
              </ul>
            </div>

            {/* Benefits Card */}
            <div className="bg-white rounded-2xl shadow-md border border-purple-100 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🎯</span>
                <h3 className="text-lg font-semibold text-gray-800">Lợi ích</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center space-x-2 text-sm">
                  <span className="text-yellow-500">⚡</span>
                  <span className="text-gray-700">Tìm khóa học nhanh chóng</span>
                </li>
                <li className="flex items-center space-x-2 text-sm">
                  <span className="text-blue-500">🎓</span>
                  <span className="text-gray-700">Gợi ý chính xác theo nhu cầu</span>
                </li>
                <li className="flex items-center space-x-2 text-sm">
                  <span className="text-green-500">💬</span>
                  <span className="text-gray-700">Chat trực tiếp với AI</span>
                </li>
                <li className="flex items-center space-x-2 text-sm">
                  <span className="text-pink-500">📚</span>
                  <span className="text-gray-700">Truy cập toàn bộ khóa học</span>
                </li>
              </ul>
            </div>

            {/* Quick Tips Card */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-md p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">🚀 Bắt đầu nhanh</h3>
              <p className="text-sm text-green-50 mb-4">
                Hãy thử hỏi những câu hỏi cụ thể để nhận được gợi ý tốt nhất!
              </p>
              <div className="space-y-2 text-xs text-green-100">
                <p>✓ "Khóa học UI/UX design cho beginner"</p>
                <p>✓ "Tôi có $100, muốn học gì?"</p>
                <p>✓ "Khóa học có chứng chỉ không?"</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIChatPage;