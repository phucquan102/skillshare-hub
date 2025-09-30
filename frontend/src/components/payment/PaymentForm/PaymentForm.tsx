import React, { useState, useRef, FormEvent } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { paymentService } from '../../../services/api/paymentService';
import { enrollmentService } from '../../../services/api/enrollmentService';

interface PaymentFormProps {
  clientSecret: string;
  paymentId: string;
  courseId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = React.memo(({
  clientSecret,
  paymentId,
  courseId,
  amount,
  onSuccess,
  onCancel,
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
      console.log('⚠️ Already processing');
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setErrorMessage('');

    try {
      console.log('🔄 Starting payment confirmation...');

      // Bước 1: Xác nhận thanh toán với Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements: elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('❌ Payment failed:', error.message);
        setErrorMessage(error.message || 'Payment failed');
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status !== 'succeeded') {
        console.error('❌ Payment not succeeded:', paymentIntent?.status);
        setErrorMessage('Payment was not successful');
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }

      console.log('✅ Payment succeeded with Stripe');

      // Bước 2: Xác nhận với backend
      try {
        await paymentService.confirmPayment({
          paymentId,
          paymentIntentId: paymentIntent.id,  // ✅ FIX: Đổi từ transactionId sang paymentIntentId
          status: 'completed',
        });
        console.log('✅ Backend confirmation successful');
      } catch (backendError: any) {
        console.error('⚠️ Backend confirm failed:', backendError.message);
        // Vẫn tiếp tục vì thanh toán đã thành công trên Stripe
        // Nhưng hiển thị warning cho user
        setErrorMessage('Payment successful but there was an issue updating our records. Please contact support if needed.');
      }

      // Bước 3: Tạo enrollment
      try {
        await enrollmentService.createEnrollment(courseId, paymentId);
        console.log('✅ Enrollment created successfully');
      } catch (enrollError: any) {
        console.error('⚠️ Enrollment failed:', enrollError.message);
        // Enrollment thất bại nhưng thanh toán đã thành công
        setErrorMessage('Payment successful but enrollment failed. Please contact support to complete your enrollment.');
      }

      // Redirect sau một khoảng delay nhỏ để user có thể đọc message
      console.log('✅ Redirecting to success page...');
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      processingRef.current = false;
      setIsProcessing(false);
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
            setErrorMessage('Failed to load payment form');
          }}
        />
      </div>

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={!stripe || !elements || !isReady || isProcessing}
          className="flex-1 bg-[#4361ee] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#3a0ca3] disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                   xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 
                         0 12h4zm2 5.291A7.962 7.962 0 
                         014 12H0c0 3.042 1.135 5.824 
                         3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : isReady ? (
            `Pay $${amount}`
          ) : (
            'Loading...'
          )}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
});

PaymentForm.displayName = 'PaymentForm';

export default PaymentForm;