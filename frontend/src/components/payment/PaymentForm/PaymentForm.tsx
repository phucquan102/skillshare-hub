// components/Payment/PaymentForm.tsx
import React, { useState, useRef, FormEvent } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom'; // 🆕 THÊM
import { paymentService } from '../../../services/api/paymentService';
import { enrollmentService, EnrollmentResponse } from '../../../services/api/enrollmentService';

interface PaymentFormProps {
  clientSecret: string;
  paymentId: string;
  courseId: string;
  lessonId?: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
  isInstructorFee?: boolean;
  paymentType?: 'course_payment' | 'lesson_payment';
  userEmail?: string;
  userName?: string;
}

const PaymentForm: React.FC<PaymentFormProps> = React.memo(({
  clientSecret,
  paymentId,
  courseId,
  lessonId,
  amount,
  onSuccess,
  onCancel,
  isInstructorFee = false,
  paymentType = 'course_payment',
  userEmail = '',
  userName = ''
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate(); // 🆕 THÊM
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const processingRef = useRef(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !isReady) {
      setErrorMessage('Payment form is not ready yet');
      return;
    }

    if (processingRef.current) {
      console.log('⚠️ Payment already processing');
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setErrorMessage('');

    try {
      console.log('🔄 Starting payment process...', {
        paymentType,
        courseId,
        lessonId,
        paymentId,
        amount,
        userEmail,
        userName
      });

      // Bước 1: Xác nhận thanh toán với Stripe
      const confirmParams: any = {
        elements: elements,
        redirect: 'if_required',
      };

      // 🚨 QUAN TRỌNG: Thêm billing details nếu có thông tin user
      if (userEmail || userName) {
        confirmParams.confirmParams = {
          payment_method_data: {
            billing_details: {
              ...(userName && { name: userName }),
              ...(userEmail && { email: userEmail }),
            }
          }
        };
      }

      const { error, paymentIntent } = await stripe.confirmPayment(confirmParams);

      if (error) {
        console.error('❌ Stripe payment failed:', error.message);
        setErrorMessage(error.message || 'Thanh toán thất bại');
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status !== 'succeeded') {
        console.error('❌ Payment not succeeded:', paymentIntent?.status);
        setErrorMessage('Thanh toán chưa thành công');
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }

      console.log('✅ Stripe payment succeeded');

      // Bước 2: Xác nhận với backend
      let backendConfirmed = false;
      try {
        await paymentService.confirmPayment({
          paymentId,
          paymentIntentId: paymentIntent.id,
          status: 'completed',
        });
        backendConfirmed = true;
        console.log('✅ Backend confirmation successful');
      } catch (backendError: any) {
        console.error('⚠️ Backend confirmation failed:', backendError.message);
        // Vẫn tiếp tục vì thanh toán Stripe đã thành công
      }

      // Bước 3: Xử lý enrollment dựa trên loại thanh toán
      let enrollmentResult: EnrollmentResponse | null = null;
      
      if (!isInstructorFee && courseId && courseId.trim() !== '') {
        try {
          if (paymentType === 'lesson_payment' && lessonId) {
            console.log('🛒 Purchasing individual lesson:', { courseId, lessonId, amount });
            enrollmentResult = await enrollmentService.purchaseLesson(
              courseId,
              lessonId,
              paymentId,
              amount
            );
            
            // 🆕 SỬA: Xử lý trường hợp đã mua lesson
            if (enrollmentResult.alreadyPurchased) {
              console.log('ℹ️ Lesson already purchased, granting access');
              setErrorMessage('Bạn đã sở hữu bài học này. Đang chuyển hướng...');
              
              // 🆕 THÊM: Chuyển hướng đến lesson sau 2 giây
              setTimeout(() => {
                navigate(`/student/lessons/${lessonId}`);
              }, 2000);
              return;
            } else if (!enrollmentResult.success) {
              console.warn('⚠️ Lesson purchase warning:', enrollmentResult.message);
            } else {
              console.log('✅ Lesson purchased successfully');
            }
          } else {
            console.log('🎯 Creating enrollment for course:', courseId);
            enrollmentResult = await enrollmentService.createEnrollment(courseId, paymentId);
            
            if (!enrollmentResult.success) {
              console.warn('⚠️ Enrollment creation warning:', enrollmentResult.message);
            } else {
              console.log('✅ Enrollment created successfully');
            }
          }
        } catch (enrollError: any) {
          console.error('❌ Enrollment service error:', enrollError);
        }
      } else if (isInstructorFee) {
        console.log('✅ Instructor fee - No enrollment needed');
      }

      // Bước 4: Tổng hợp thông báo
      const successMessages: string[] = ['Thanh toán thành công!'];
      
      if (paymentType === 'lesson_payment') {
        // 🆕 SỬA: Thông báo khác nhau tùy trường hợp
        if (enrollmentResult?.alreadyPurchased) {
          successMessages.push('Bạn đã sở hữu bài học này.');
        } else {
          successMessages.push('Bạn đã mua bài học thành công và có thể tham gia học ngay.');
        }
      } else if (!isInstructorFee) {
        successMessages.push('Bạn đã đăng ký khóa học thành công.');
      }
      
      if (!backendConfirmed) {
        successMessages.push('Lưu ý: Có vấn đề khi cập nhật hồ sơ thanh toán.');
      }
      
      if (enrollmentResult && !enrollmentResult.success && !enrollmentResult.alreadyPurchased) {
        successMessages.push(`Lưu ý: ${enrollmentResult.message}`);
      }

      const finalMessage = successMessages.join(' ');
      setErrorMessage(finalMessage);

      console.log('✅ Payment process completed successfully', { paymentType });
      
      // 🆕 SỬA: Chuyển hướng sau khi xử lý
      setTimeout(() => {
        if (paymentType === 'lesson_payment' && lessonId) {
          // Chuyển hướng đến lesson detail
          navigate(`/student/lessons/${lessonId}`);
        } else {
          // Gọi callback onSuccess cho các trường hợp khác
          onSuccess();
        }
      }, 3000);

    } catch (err: any) {
      console.error('💥 Unexpected payment error:', err);
      setErrorMessage('Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.');
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (!isProcessing) {
      onCancel();
    }
  };

  const getPaymentTypeInfo = () => {
    if (isInstructorFee) {
      return {
        title: 'Phí đăng khóa học',
        description: 'Thanh toán phí đăng khóa học cho instructor'
      };
    }
    
    if (paymentType === 'lesson_payment') {
      return {
        title: 'Mua bài học riêng lẻ',
        description: 'Thanh toán cho một bài học cụ thể'
      };
    }
    
    return {
      title: 'Đăng ký khóa học',
      description: 'Thanh toán để đăng ký toàn bộ khóa học'
    };
  };

  const paymentInfo = getPaymentTypeInfo();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Type Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{paymentInfo.title}</h3>
            <p className="text-gray-600 text-sm">{paymentInfo.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#4361ee]">${amount}</div>
            {paymentType === 'lesson_payment' && (
              <div className="text-xs text-gray-500 mt-1">Single Lesson</div>
            )}
          </div>
        </div>
      </div>

      {/* User Information */}
      {(userName || userEmail) && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Thông tin thanh toán</h4>
          <div className="space-y-1 text-sm text-gray-600">
            {userName && <div><strong>Họ tên:</strong> {userName}</div>}
            {userEmail && <div><strong>Email:</strong> {userEmail}</div>}
          </div>
        </div>
      )}

      {/* Payment Element */}
      <div className="payment-element-wrapper">
        <PaymentElement
          onReady={() => {
            console.log('✅ PaymentElement ready');
            setIsReady(true);
          }}
          onLoadError={(err) => {
            console.error('❌ PaymentElement error:', err);
            setErrorMessage('Không thể tải form thanh toán. Vui lòng thử lại.');
          }}
          options={{
            // 🚨 SỬA LỖI: Cho phép Stripe thu thập thông tin billing details
            fields: {
              billingDetails: {
                name: 'auto',  // Thay 'never' bằng 'auto'
                email: 'auto', // Thay 'never' bằng 'auto'
                phone: 'auto', // Có thể giữ 'never' nếu không cần
                address: {
                  country: 'auto',
                  postalCode: 'auto'
                }
              }
            }
          }}
        />
      </div>

      {/* Status Messages */}
      {errorMessage && (
        <div className={`p-4 rounded-lg ${
          errorMessage.includes('thành công') || errorMessage.includes('sở hữu')
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex items-start">
            {errorMessage.includes('thành công') || errorMessage.includes('sở hữu') ? (
              <span className="text-green-500 mr-2 mt-0.5">✅</span>
            ) : (
              <span className="text-red-500 mr-2 mt-0.5">⚠️</span>
            )}
            <div>
              <span className="font-medium">
                {errorMessage.includes('thành công') || errorMessage.includes('sở hữu') 
                  ? 'Thành công!' 
                  : 'Lỗi:'}
              </span>
              <span className="ml-1">{errorMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={!stripe || !elements || !isReady || isProcessing}
          className="flex-1 bg-gradient-to-r from-[#4361ee] to-[#3a0ca3] text-white py-4 px-6 rounded-xl font-semibold hover:from-[#3a0ca3] hover:to-[#4361ee] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                   xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý...
            </>
          ) : (
            <>
              <span className="mr-2">💳</span>
              {paymentType === 'lesson_payment' ? `Mua Bài Học - $${amount}` : `Thanh Toán - $${amount}`}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={isProcessing}
          className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 border border-gray-200"
        >
          ← Quay lại
        </button>
      </div>

      {/* Security Badge */}
      <div className="text-center pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Thanh toán được bảo mật và mã hóa</span>
        </div>
      </div>

      {/* Debug info - chỉ hiển thị trong môi trường development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>Debug Info:</strong>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div><strong>Payment ID:</strong> {paymentId}</div>
            <div><strong>Course ID:</strong> {courseId || 'N/A'}</div>
            <div><strong>Lesson ID:</strong> {lessonId || 'N/A'}</div>
            <div><strong>Type:</strong> {paymentType}</div>
            <div><strong>Amount:</strong> ${amount}</div>
            <div><strong>User Name:</strong> {userName || 'N/A'}</div>
            <div><strong>User Email:</strong> {userEmail || 'N/A'}</div>
            <div><strong>Ready:</strong> {isReady ? 'Yes' : 'No'}</div>
            <div><strong>Processing:</strong> {isProcessing ? 'Yes' : 'No'}</div>
            <div><strong>Stripe:</strong> {stripe ? 'Loaded' : 'Loading'}</div>
          </div>
        </div>
      )}
    </form>
  );
});

PaymentForm.displayName = 'PaymentForm';

export default PaymentForm;