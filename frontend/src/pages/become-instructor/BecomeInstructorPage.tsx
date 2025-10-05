import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../../components/payment/PaymentForm/PaymentForm';
import { instructorService } from '../../services/api/instructorService';
import { authService } from '../../services/api/authService'; // Thêm import này
import styles from './BecomeInstructorPage.module.scss';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

const BecomeInstructorPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false); // Thêm state cho upgrading
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentId, setPaymentId] = useState('');

  // Nếu user đã là instructor
  if (user?.role === 'instructor') {
    return (
      <div className={styles.instructorPage}>
        <div className={styles.container}>
          <div className={styles.successMessage}>
            <h2>🎉 Bạn đã là Instructor!</h2>
            <p>Bạn đã có quyền truy cập vào tất cả các tính năng dành cho giảng viên.</p>
            <button 
              onClick={() => navigate('/instructor/dashboard')}
              className={styles.primaryButton}
            >
              Đến Dashboard Instructor
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleBecomeInstructor = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const response = await instructorService.createInstructorPayment();

      if (response.success && response.data?.clientSecret) {
        setClientSecret(response.data.clientSecret);
        setPaymentId(response.data.paymentId);
      } else {
        setError(response.message || 'Có lỗi xảy ra khi tạo thanh toán');
      }
    } catch (err: any) {
      console.error('Error creating payment:', err);
      setError(err.message || 'Không thể kết nối đến server');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setIsUpgrading(true);
    setError('');

    try {
      console.log('🔄 [BecomeInstructorPage] Starting upgrade process...');

      // 1. Gọi API để nâng cấp role trên server
      const upgradeResult = await instructorService.upgradeToInstructor();
      
      if (!upgradeResult.success) {
        throw new Error(upgradeResult.message || 'Nâng cấp thất bại');
      }

      console.log('✅ [BecomeInstructorPage] Upgrade API call successful');

      // 2. Xử lý token và profile sau khi upgrade
      const tokenCheck = await instructorService.handlePostUpgradeToken();
      
      if (tokenCheck.needsRelogin) {
        console.warn('⚠️ [BecomeInstructorPage] Token role mismatch detected');
        alert('Nâng cấp thành công! Vui lòng đăng nhập lại để cập nhật quyền.');
        
        // Đăng xuất và yêu cầu đăng nhập lại
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      // 3. Lấy profile mới nhất từ server
      console.log('🔄 [BecomeInstructorPage] Getting updated profile...');
      const profileResponse = await authService.getProfile();
      
      // 4. Cập nhật thông tin user trong context và localStorage
      if (profileResponse.user) {
        updateUser(profileResponse.user);
        localStorage.setItem('user', JSON.stringify(profileResponse.user));
        
        console.log('✅ [BecomeInstructorPage] User updated successfully:', {
          role: profileResponse.user.role,
          id: profileResponse.user._id
        });
      }

      // 5. Đánh dấu thành công
      setSuccess(true);
      
      console.log('🎉 [BecomeInstructorPage] Upgrade process completed successfully');

    } catch (err: any) {
      console.error('❌ [BecomeInstructorPage] Upgrade error:', err);
      setError(err.message || 'Có lỗi xảy ra khi nâng cấp tài khoản. Vui lòng liên hệ hỗ trợ.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handlePaymentCancel = () => {
    setClientSecret('');
    setPaymentId('');
  };

  // Hiển thị loading khi đang xử lý upgrade
  if (isUpgrading) {
    return (
      <div className={styles.instructorPage}>
        <div className={styles.container}>
          <div className={styles.loadingMessage}>
            <h2>🔄 Đang nâng cấp tài khoản...</h2>
            <p>Vui lòng chờ trong giây lát. Quá trình này có thể mất vài phút.</p>
            <div className={styles.loadingSpinner}></div>
          </div>
        </div>
      </div>
    );
  }

  if (clientSecret && !success) {
    return (
      <div className={styles.instructorPage}>
        <div className={styles.container}>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              clientSecret={clientSecret}
              paymentId={paymentId}
              courseId="" // Empty for instructor fee
              amount={10} // $10 instructor fee
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
              isInstructorFee={true}
            />
          </Elements>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.instructorPage}>
        <div className={styles.container}>
          <div className={styles.successMessage}>
            <h2>🎉 Chúc mừng! Bạn đã trở thành Instructor</h2>
            <p>Tài khoản của bạn đã được nâng cấp thành công. Bây giờ bạn có thể:</p>
            <ul>
              <li>✅ Tạo và quản lý khóa học</li>
              <li>✅ Kiếm thu nhập từ việc giảng dạy</li>
              <li>✅ Tiếp cận hàng ngàn học viên tiềm năng</li>
              <li>✅ Sử dụng công cụ quản lý khóa học chuyên nghiệp</li>
            </ul>
            <div className={styles.actionButtons}>
              <button 
                onClick={() => navigate('/instructor/dashboard')}
                className={styles.primaryButton}
              >
                Đến Dashboard Instructor
              </button>
              <button 
                onClick={() => navigate('/courses/create')}
                className={styles.secondaryButton}
              >
                Tạo Khóa Học Đầu Tiên
              </button>
              <button 
                onClick={() => {
                  // Force refresh để đảm bảo mọi thứ được cập nhật
                  window.location.reload();
                }}
                className={styles.outlineButton}
              >
                Refresh Trang
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.instructorPage}>
      <div className={styles.container}>
        <div className={styles.instructorHero}>
          <h1>Trở Thành Giảng Viên</h1>
          <p className={styles.subtitle}>
            Chia sẻ kiến thức, xây dựng thương hiệu và kiếm thu nhập
          </p>
        </div>

        <div className={styles.instructorContent}>
          <div className={styles.benefitsSection}>
            <h2>Lợi ích khi trở thành Instructor</h2>
            <div className={styles.benefitsGrid}>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>💰</div>
                <h3>Thu nhập thụ động</h3>
                <p>Kiếm thu nhập từ việc bán khóa học và bài giảng</p>
              </div>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>👥</div>
                <h3>Tiếp cận học viên</h3>
                <p>Kết nối với hàng ngàn học viên tiềm năng</p>
              </div>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>🏆</div>
                <h3>Xây dựng thương hiệu</h3>
                <p>Khẳng định chuyên môn và xây dựng uy tín</p>
              </div>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>⚡</div>
                <h3>Công cụ mạnh mẽ</h3>
                <p>Sử dụng hệ thống quản lý khóa học chuyên nghiệp</p>
              </div>
            </div>
          </div>

          <div className={styles.pricingSection}>
            <div className={styles.pricingCard}>
              <div className={styles.pricingHeader}>
                <h3>Phí Đăng Ký Instructor</h3>
                <div className={styles.price}>$10</div>
                <p>Một lần duy nhất</p>
              </div>
              <div className={styles.pricingFeatures}>
                <ul>
                  <li>✓ Truy cập không giới hạn vào công cụ tạo khóa học</li>
                  <li>✓ Hỗ trợ kỹ thuật 24/7</li>
                  <li>✓ Thanh toán an toàn qua Stripe</li>
                  <li>✓ Hoàn tiền trong 30 ngày nếu không hài lòng</li>
                  <li>✓ Cập nhật tính năng miễn phí</li>
                </ul>
              </div>
              <button
                onClick={handleBecomeInstructor}
                disabled={isProcessing}
                className={`${styles.primaryButton} ${styles.btnLarge}`}
              >
                {isProcessing ? 'Đang xử lý...' : 'Đăng Ký Ngay - $10'}
              </button>
              {error && <div className={styles.errorMessage}>{error}</div>}
              
              {/* Thêm debug info */}
              <div className={styles.debugInfo}>
                <p><strong>Debug Info:</strong></p>
                <p>User Role: {user?.role}</p>
                <p>User ID: {user?._id || user?.id}</p>
              </div>
            </div>
          </div>

          <div className={styles.requirementsSection}>
            <h2>Yêu Cầu Trở Thành Instructor</h2>
            <div className={styles.requirementsList}>
              <div className={styles.requirement}>
                <h4>Chuyên môn vững vàng</h4>
                <p>Có kiến thức chuyên sâu về lĩnh vực bạn muốn giảng dạy</p>
              </div>
              <div className={styles.requirement}>
                <h4>Kỹ năng truyền đạt</h4>
                <p>Khả năng giải thích các khái niệm phức tạp một cách dễ hiểu</p>
              </div>
              <div className={styles.requirement}>
                <h4>Cam kết chất lượng</h4>
                <p>Đảm bảo nội dung khóa học có giá trị và cập nhật</p>
              </div>
              <div className={styles.requirement}>
                <h4>Tài khoản xác minh</h4>
                <p>Email đã được xác thực và thông tin hồ sơ đầy đủ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeInstructorPage;