// src/pages/Auth/ProfilePage/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services/api/authService';
import { User } from '../../../types/user.types';
import { 
  FiEdit, 
  FiSave, 
  FiX, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiCalendar,
  FiAward,
  FiClock,
  FiStar,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiGlobe,
  FiBell
} from 'react-icons/fi';
import { HiOutlineAcademicCap, HiOutlineUserGroup } from 'react-icons/hi';

interface ProfileFormData {
  fullName: string;
  profile?: {
    bio?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  preferences?: {
    language?: string;
    timezone?: string;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
  };
}

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    profile: {
      bio: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      gender: '',
    },
    preferences: {
      language: 'vi',
      timezone: 'Asia/Ho_Chi_Minh',
      emailNotifications: true,
      smsNotifications: false,
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        profile: {
          bio: user.profile?.bio || '',
          phone: user.profile?.phone || '',
          address: user.profile?.address || '',
          dateOfBirth: user.profile?.dateOfBirth || '',
          gender: user.profile?.gender || '',
        },
        preferences: {
          language: user.preferences?.language || 'vi',
          timezone: user.preferences?.timezone || 'Asia/Ho_Chi_Minh',
          emailNotifications: user.preferences?.emailNotifications ?? true,
          smsNotifications: user.preferences?.smsNotifications ?? false,
        },
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await authService.updateProfile(formData);
      updateUser(response.user);
      setMessage('Cập nhật thành công!');
      setIsEditing(false);
    } catch (error: any) {
      setMessage(error.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('profile.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [field]: value
        }
      }));
    } else if (name.startsWith('preferences.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [field]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent">
              Hồ Sơ Cá Nhân
            </h1>
            <p className="text-gray-600 mt-2">Quản lý thông tin cá nhân và tùy chọn tài khoản</p>
          </div>
          <button 
            className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 ${
              isEditing 
                ? 'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg' 
                : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:shadow-xl hover:scale-105'
            }`}
            onClick={() => setIsEditing(!isEditing)}
            type="button"
          >
            {isEditing ? <FiX className="w-5 h-5" /> : <FiEdit className="w-5 h-5" />}
            {isEditing ? 'Hủy' : 'Chỉnh Sửa'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-2xl backdrop-blur-sm border-2 ${
            message.includes('thành công') 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <div className="flex items-center gap-3">
              {message.includes('thành công') ? 
                <FiCheckCircle className="w-5 h-5" /> : 
                <FiAlertCircle className="w-5 h-5" />
              }
              <span className="font-medium">{message}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-emerald-200 shadow-lg">
                    {user.profile?.avatar ? (
                      <img src={user.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {user.fullName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                    <FiUser className="w-3 h-3 text-white" />
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-1">{user.fullName}</h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-3">
                  <HiOutlineAcademicCap className="w-4 h-4" />
                  {user.role === 'instructor' ? 'Instructor' : 'Student'}
                </div>
                <p className="text-gray-600 flex items-center justify-center gap-2">
                  <FiMail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>

              {/* Verification Status */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    user.emailVerified ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {user.emailVerified ? <FiCheckCircle className="w-4 h-4" /> : <FiAlertCircle className="w-4 h-4" />}
                    {user.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">SĐT:</span>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    user.phoneVerified ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {user.phoneVerified ? <FiCheckCircle className="w-4 h-4" /> : <FiAlertCircle className="w-4 h-4" />}
                    {user.phoneVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiAward className="w-5 h-5 text-emerald-500" />
                Thống Kê Học Tập
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <HiOutlineUserGroup className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-gray-600">Khóa học hoàn thành</span>
                  </div>
                  <strong className="text-xl font-bold text-gray-900">{user.stats?.coursesCompleted || 0}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FiClock className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-gray-600">Tổng giờ học</span>
                  </div>
                  <strong className="text-xl font-bold text-gray-900">{user.stats?.totalLearningHours || 0}h</strong>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <FiStar className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-gray-600">Đánh giá trung bình</span>
                  </div>
                  <strong className="text-xl font-bold text-gray-900">{user.stats?.avgRating || 0}/5</strong>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiShield className="w-5 h-5 text-emerald-500" />
                Thông Tin Tài Khoản
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Trạng thái:</span>
                  <strong className={`text-sm font-medium ${
                    user.isActive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {user.isActive ? '🟢 Đang hoạt động' : '🔴 Đã khóa'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Xác thực:</span>
                  <strong className={`text-sm font-medium ${
                    user.isVerified ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {user.isVerified ? '✅ Đã xác thực' : '❌ Chưa xác thực'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tham gia:</span>
                  <strong className="text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</strong>
                </div>
                {user.lastLogin && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Đăng nhập cuối:</span>
                    <strong className="text-sm text-gray-900">{new Date(user.lastLogin).toLocaleDateString('vi-VN')}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center">
                      <FiUser className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Thông Tin Cá Nhân</h3>
                      <p className="text-gray-600">Cập nhật thông tin cá nhân của bạn</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <FiUser className="w-4 h-4" />
                        Họ và Tên *
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        required
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <FiMail className="w-4 h-4" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="profile.bio" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FiUser className="w-4 h-4" />
                      Giới Thiệu Bản Thân
                    </label>
                    <textarea
                      id="profile.bio"
                      name="profile.bio"
                      value={formData.profile?.bio || ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows={4}
                      placeholder="Giới thiệu về bản thân, kinh nghiệm và sở thích..."
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 outline-none resize-none disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="profile.phone" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <FiPhone className="w-4 h-4" />
                        Số Điện Thoại
                      </label>
                      <input
                        id="profile.phone"
                        type="tel"
                        name="profile.phone"
                        value={formData.profile?.phone || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="Nhập số điện thoại..."
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="profile.dateOfBirth" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <FiCalendar className="w-4 h-4" />
                        Ngày Sinh
                      </label>
                      <input
                        id="profile.dateOfBirth"
                        type="date"
                        name="profile.dateOfBirth"
                        value={formData.profile?.dateOfBirth || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="profile.gender" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <FiUser className="w-4 h-4" />
                        Giới Tính
                      </label>
                      <select
                        id="profile.gender"
                        name="profile.gender"
                        value={formData.profile?.gender || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="profile.address" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <FiMapPin className="w-4 h-4" />
                        Địa Chỉ
                      </label>
                      <input
                        id="profile.address"
                        type="text"
                        name="profile.address"
                        value={formData.profile?.address || ''}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="Nhập địa chỉ..."
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Preferences Section */}
                <div className="space-y-6 pt-8 border-t border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                      <FiGlobe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Cài Đặt & Tùy Chọn</h3>
                      <p className="text-gray-600">Tùy chỉnh trải nghiệm của bạn</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="preferences.language" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <FiGlobe className="w-4 h-4" />
                        Ngôn Ngữ
                      </label>
                      <select
                        id="preferences.language"
                        name="preferences.language"
                        value={formData.preferences?.language || 'vi'}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="preferences.timezone" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <FiClock className="w-4 h-4" />
                        Múi Giờ
                      </label>
                      <select
                        id="preferences.timezone"
                        name="preferences.timezone"
                        value={formData.preferences?.timezone || 'Asia/Ho_Chi_Minh'}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 outline-none disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="Asia/Ho_Chi_Minh">GMT+7 (Việt Nam)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FiBell className="w-4 h-4" />
                      Tùy Chọn Thông Báo
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-emerald-300 transition-all duration-300 cursor-pointer">
                        <input
                          type="checkbox"
                          name="preferences.emailNotifications"
                          checked={formData.preferences?.emailNotifications || false}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900">Thông báo qua email</span>
                          <p className="text-sm text-gray-600">Nhận thông báo qua email</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-emerald-300 transition-all duration-300 cursor-pointer">
                        <input
                          type="checkbox"
                          name="preferences.smsNotifications"
                          checked={formData.preferences?.smsNotifications || false}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900">Thông báo SMS</span>
                          <p className="text-sm text-gray-600">Nhận thông báo qua tin nhắn</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <button 
                      type="submit" 
                      className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-3 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <FiSave className="w-5 h-5" />
                      {isLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </button>
                    <button 
                      type="button"
                      className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-3"
                      onClick={() => setIsEditing(false)}
                    >
                      <FiX className="w-5 h-5" />
                      Hủy
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;