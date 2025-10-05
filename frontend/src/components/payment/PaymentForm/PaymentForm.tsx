import React, { useState, useRef, FormEvent } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { paymentService } from '../../../services/api/paymentService';
import { enrollmentService, EnrollmentResponse } from '../../../services/api/enrollmentService';

interface PaymentFormProps {
  clientSecret: string;
  paymentId: string;
  courseId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
  isInstructorFee?: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = React.memo(({
  clientSecret,
  paymentId,
  courseId,
  amount,
  onSuccess,
  onCancel,
  isInstructorFee = false
}) => {
  const stripe = useStripe();
  const elements = useElements();
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
        isInstructorFee,
        courseId,
        paymentId,
        amount
      });

      // Bước 1: Xác nhận thanh toán với Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements: elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

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

      // Bước 3: Xử lý enrollment cho course payment
      let enrollmentResult: EnrollmentResponse | null = null;
      
      if (!isInstructorFee && courseId && courseId.trim() !== '') {
        try {
          console.log('🎯 Creating enrollment for course:', courseId);
          enrollmentResult = await enrollmentService.createEnrollment(courseId, paymentId);
          
          if (!enrollmentResult.success) {
            console.warn('⚠️ Enrollment creation warning:', enrollmentResult.message);
            // Không throw error, chỉ hiển thị warning
          } else {
            console.log('✅ Enrollment created successfully');
          }
        } catch (enrollError: any) {
          console.error('❌ Enrollment service error:', enrollError);
          // Không throw error, chỉ hiển thị warning
        }
      } else if (isInstructorFee) {
        console.log('✅ Instructor fee - No enrollment needed');
      }

      // Bước 4: Tổng hợp thông báo
      const successMessages: string[] = ['Thanh toán thành công!'];
      
      if (!backendConfirmed) {
        successMessages.push('Lưu ý: Có vấn đề khi cập nhật hồ sơ thanh toán.');
      }
      
      if (enrollmentResult && !enrollmentResult.success) {
        successMessages.push(`Lưu ý: ${enrollmentResult.message}`);
      }

      // Hiển thị thông báo tổng hợp
      if (successMessages.length > 1) {
        setErrorMessage(successMessages.join(' '));
      } else {
        setErrorMessage(''); // Clear any previous errors
      }

      console.log('✅ Payment process completed successfully');
      
      // Redirect sau delay
      setTimeout(() => {
        onSuccess();
      }, 2000);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        />
      </div>

      {errorMessage && (
        <div className={`p-4 rounded-lg ${
          errorMessage.includes('thành công') 
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex items-center">
            {errorMessage.includes('thành công') ? (
              <span className="text-green-500 mr-2">✅</span>
            ) : (
              <span className="text-red-500 mr-2">⚠️</span>
            )}
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={!stripe || !elements || !isReady || isProcessing}
          className="flex-1 bg-[#4361ee] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#3a0ca3] disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
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
            `Thanh toán $${amount}`
          )}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={isProcessing}
          className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition duration-200"
        >
          Hủy
        </button>
      </div>

      {/* Debug info - chỉ hiển thị trong môi trường development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>Debug Info:</strong>
          <div>Payment ID: {paymentId}</div>
          <div>Course ID: {courseId || 'N/A'}</div>
          <div>Type: {isInstructorFee ? 'Instructor Fee' : 'Course Payment'}</div>
          <div>Ready: {isReady ? 'Yes' : 'No'}</div>
        </div>
      )}
    </form>
  );
});

PaymentForm.displayName = 'PaymentForm';

export default PaymentForm;