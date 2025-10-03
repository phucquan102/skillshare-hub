// src/pages/Auth/ProfilePage/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services/api/authService';
import { User } from '../../../types/user.types';
import styles from './ProfilePage.module.scss';

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
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.profilePage}>
      <div className={styles.header}>
        <h1>Hồ Sơ Cá Nhân</h1>
        <button 
          className={styles.editButton}
          onClick={() => setIsEditing(!isEditing)}
          type="button"
        >
          {isEditing ? 'Hủy' : 'Chỉnh Sửa'}
        </button>
      </div>

      {message && (
        <div className={`${styles.message} ${message.includes('thành công') ? styles.success : styles.error}`}>
          {message}
        </div>
      )}

      <div className={styles.profileContainer}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user.profile?.avatar ? (
                <img src={user.profile.avatar} alt="Avatar" />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {user.fullName?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h2>{user.fullName}</h2>
            <p className={styles.role}>{user.role}</p>
            <p className={styles.email}>{user.email}</p>
            
            <div className={styles.verificationStatus}>
              <div className={styles.statusItem}>
                <span>Email: </span>
                <strong className={user.emailVerified ? styles.verified : styles.unverified}>
                  {user.emailVerified ? '✅ Đã xác thực' : '❌ Chưa xác thực'}
                </strong>
              </div>
              <div className={styles.statusItem}>
                <span>SĐT: </span>
                <strong className={user.phoneVerified ? styles.verified : styles.unverified}>
                  {user.phoneVerified ? '✅ Đã xác thực' : '❌ Chưa xác thực'}
                </strong>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className={styles.stats}>
            <h3>Thống Kê Học Tập</h3>
            <div className={styles.statItem}>
              <span>Khóa học đã hoàn thành:</span>
              <strong>{user.stats?.coursesCompleted || 0}</strong>
            </div>
            <div className={styles.statItem}>
              <span>Tổng giờ học:</span>
              <strong>{user.stats?.totalLearningHours || 0}h</strong>
            </div>
            <div className={styles.statItem}>
              <span>Đánh giá trung bình:</span>
              <strong>{user.stats?.avgRating || 0}/5</strong>
            </div>
          </div>

          {/* Account Info */}
          <div className={styles.accountInfo}>
            <h3>Thông Tin Tài Khoản</h3>
            <div className={styles.infoItem}>
              <span>Trạng thái:</span>
              <strong className={user.isActive ? styles.active : styles.inactive}>
                {user.isActive ? '🟢 Đang hoạt động' : '🔴 Đã khóa'}
              </strong>
            </div>
            <div className={styles.infoItem}>
              <span>Xác thực:</span>
              <strong className={user.isVerified ? styles.verified : styles.unverified}>
                {user.isVerified ? '✅ Đã xác thực' : '❌ Chưa xác thực'}
              </strong>
            </div>
            <div className={styles.infoItem}>
              <span>Tham gia:</span>
              <strong>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</strong>
            </div>
            {user.lastLogin && (
              <div className={styles.infoItem}>
                <span>Đăng nhập cuối:</span>
                <strong>{new Date(user.lastLogin).toLocaleDateString('vi-VN')}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Personal Information Section */}
            <div className={styles.section}>
              <h3>Thông Tin Cá Nhân</h3>
              
              <div className={styles.formGroup}>
                <label htmlFor="fullName">Họ và Tên *</label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className={styles.disabled}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="profile.bio">Giới Thiệu Bản Thân</label>
                <textarea
                  id="profile.bio"
                  name="profile.bio"
                  value={formData.profile?.bio || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={3}
                  placeholder="Giới thiệu về bản thân..."
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="profile.phone">Số Điện Thoại</label>
                  <input
                    id="profile.phone"
                    type="tel"
                    name="profile.phone"
                    value={formData.profile?.phone || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Nhập số điện thoại..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="profile.dateOfBirth">Ngày Sinh</label>
                  <input
                    id="profile.dateOfBirth"
                    type="date"
                    name="profile.dateOfBirth"
                    value={formData.profile?.dateOfBirth || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="profile.gender">Giới Tính</label>
                  <select
                    id="profile.gender"
                    name="profile.gender"
                    value={formData.profile?.gender || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="profile.address">Địa Chỉ</label>
                <input
                  id="profile.address"
                  type="text"
                  name="profile.address"
                  value={formData.profile?.address || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Nhập địa chỉ..."
                />
              </div>
            </div>

            {/* Preferences Section */}
            <div className={styles.section}>
              <h3>Cài Đặt & Tùy Chọn</h3>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="preferences.language">Ngôn Ngữ</label>
                  <select
                    id="preferences.language"
                    name="preferences.language"
                    value={formData.preferences?.language || 'vi'}
                    onChange={handleChange}
                    disabled={!isEditing}
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="preferences.timezone">Múi Giờ</label>
                  <select
                    id="preferences.timezone"
                    name="preferences.timezone"
                    value={formData.preferences?.timezone || 'Asia/Ho_Chi_Minh'}
                    onChange={handleChange}
                    disabled={!isEditing}
                  >
                    <option value="Asia/Ho_Chi_Minh">GMT+7 (Việt Nam)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="preferences.emailNotifications"
                    checked={formData.preferences?.emailNotifications || false}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                  <span>Thông báo qua email</span>
                </label>
                
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="preferences.smsNotifications"
                    checked={formData.preferences?.smsNotifications || false}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                  <span>Thông báo SMS</span>
                </label>
              </div>
            </div>

            {isEditing && (
              <div className={styles.formActions}>
                <button 
                  type="submit" 
                  className={styles.saveButton}
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
                <button 
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setIsEditing(false)}
                >
                  Hủy
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;