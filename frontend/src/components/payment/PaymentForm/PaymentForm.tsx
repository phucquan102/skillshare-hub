// components/Payment/PaymentForm.tsx
import React, { useState, useRef, FormEvent } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '../../../services/api/paymentService';
import { enrollmentService, EnrollmentResponse } from '../../../services/api/enrollmentService';
import { 
  FiCreditCard, 
  FiLock, 
  FiCheck, 
  FiAlertCircle, 
  FiArrowLeft,
  FiUser,
  FiMail,
  FiLoader
} from 'react-icons/fi';
import { HiOutlineShieldCheck } from 'react-icons/hi';

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
  const navigate = useNavigate();
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

      // Step 1: Confirm payment with Stripe
      const confirmParams: any = {
        elements: elements,
        redirect: 'if_required',
      };

      // IMPORTANT: Add billing details if user information is available
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
        setErrorMessage(error.message || 'Payment failed');
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status !== 'succeeded') {
        console.error('❌ Payment not succeeded:', paymentIntent?.status);
        setErrorMessage('Payment not completed successfully');
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }

      console.log('✅ Stripe payment succeeded');

      // Step 2: Confirm with backend
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
        // Continue because Stripe payment was successful
      }

      // Step 3: Handle enrollment based on payment type
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
            
            // FIX: Handle already purchased lesson case
            if (enrollmentResult.alreadyPurchased) {
              console.log('ℹ️ Lesson already purchased, granting access');
              setErrorMessage('You already own this lesson. Redirecting...');
              
              // ADD: Redirect to lesson after 2 seconds
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

      // Step 4: Compile success messages
      const successMessages: string[] = ['Payment successful!'];
      
      if (paymentType === 'lesson_payment') {
        // FIX: Different messages based on case
        if (enrollmentResult?.alreadyPurchased) {
          successMessages.push('You already own this lesson.');
        } else {
          successMessages.push('You have successfully purchased the lesson and can start learning immediately.');
        }
      } else if (!isInstructorFee) {
        successMessages.push('You have successfully enrolled in the course.');
      }
      
      if (!backendConfirmed) {
        successMessages.push('Note: There was an issue updating your payment profile.');
      }
      
      if (enrollmentResult && !enrollmentResult.success && !enrollmentResult.alreadyPurchased) {
        successMessages.push(`Note: ${enrollmentResult.message}`);
      }

      const finalMessage = successMessages.join(' ');
      setErrorMessage(finalMessage);

      console.log('✅ Payment process completed successfully', { paymentType });
      
      // FIX: Redirect after processing
      setTimeout(() => {
        if (paymentType === 'lesson_payment' && lessonId) {
          // Redirect to lesson detail
          navigate(`/student/lessons/${lessonId}`);
        } else {
          // Call onSuccess callback for other cases
          onSuccess();
        }
      }, 3000);

    } catch (err: any) {
      console.error('💥 Unexpected payment error:', err);
      setErrorMessage('An error occurred during payment processing. Please try again.');
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
        title: 'Course Listing Fee',
        description: 'Payment for course listing fee for instructor'
      };
    }
    
    if (paymentType === 'lesson_payment') {
      return {
        title: 'Purchase Individual Lesson',
        description: 'Payment for a specific lesson'
      };
    }
    
    return {
      title: 'Course Enrollment',
      description: 'Payment to enroll in the complete course'
    };
  };

  const paymentInfo = getPaymentTypeInfo();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Type Info */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
              <FiCreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{paymentInfo.title}</h3>
              <p className="text-gray-600 text-sm">{paymentInfo.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              ${amount}
            </div>
            {paymentType === 'lesson_payment' && (
              <div className="text-xs text-gray-500 mt-1">Single Lesson</div>
            )}
          </div>
        </div>
      </div>

      {/* User Information */}
      {(userName || userEmail) && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200 backdrop-blur-sm">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FiUser className="w-4 h-4 text-emerald-500" />
            Billing Information
          </h4>
          <div className="space-y-2 text-sm text-gray-600">
            {userName && (
              <div className="flex items-center gap-2">
                <FiUser className="w-4 h-4 text-gray-400" />
                <span><strong>Name:</strong> {userName}</span>
              </div>
            )}
            {userEmail && (
              <div className="flex items-center gap-2">
                <FiMail className="w-4 h-4 text-gray-400" />
                <span><strong>Email:</strong> {userEmail}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Element */}
      <div className="payment-element-wrapper bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FiCreditCard className="w-5 h-5 text-emerald-500" />
          <h4 className="font-semibold text-gray-900">Payment Details</h4>
        </div>
        <PaymentElement
          onReady={() => {
            console.log('✅ PaymentElement ready');
            setIsReady(true);
          }}
          onLoadError={(err) => {
            console.error('❌ PaymentElement error:', err);
            setErrorMessage('Unable to load payment form. Please try again.');
          }}
          options={{
            fields: {
              billingDetails: {
                name: 'auto',
                email: 'auto',
                phone: 'auto',
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
        <div className={`p-5 rounded-2xl backdrop-blur-sm border ${
          errorMessage.includes('successful') || errorMessage.includes('already own')
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-start gap-3">
            {errorMessage.includes('successful') || errorMessage.includes('already own') ? (
              <FiCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <span className="font-semibold">
                {errorMessage.includes('successful') || errorMessage.includes('already own') 
                  ? 'Success!' 
                  : 'Error:'}
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
          className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white py-4 px-6 rounded-2xl font-semibold hover:from-emerald-600 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
        >
          {isProcessing ? (
            <>
              <FiLoader className="w-5 h-5 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <FiCreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {paymentType === 'lesson_payment' ? `Purchase Lesson - $${amount}` : `Complete Payment - $${amount}`}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={isProcessing}
          className="flex-1 bg-white text-gray-700 py-4 px-6 rounded-2xl font-semibold hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 border border-gray-300 hover:border-gray-400 flex items-center justify-center gap-3"
        >
          <FiArrowLeft className="w-5 h-5" />
          Go Back
        </button>
      </div>

      {/* Security Badge */}
      <div className="text-center pt-6 border-t border-gray-200">
        <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 border border-gray-200">
          <HiOutlineShieldCheck className="w-5 h-5 text-emerald-500" />
          <div className="text-left">
            <div className="font-medium text-gray-900 text-sm">Secure & Encrypted</div>
            <div className="text-gray-500 text-xs">Your payment information is protected</div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="grid grid-cols-3 gap-4 pt-4">
        <div className="text-center">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <FiLock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xs text-gray-600">256-bit SSL</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <FiCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xs text-gray-600">PCI Compliant</div>
        </div>
        <div className="text-center">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <HiOutlineShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xs text-gray-600">Money Back</div>
        </div>
      </div>

      {/* Debug info - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-800 backdrop-blur-sm">
          <strong className="flex items-center gap-2 mb-2">
            <FiAlertCircle className="w-4 h-4" />
            Debug Information
          </strong>
          <div className="grid grid-cols-2 gap-3 text-xs">
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