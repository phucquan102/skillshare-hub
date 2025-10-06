import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { paymentService } from '../../../services/api/paymentService';
import { courseService } from '../../../services/api/courseService';
import PaymentForm from '../../../components/payment/PaymentForm/PaymentForm';
import { FiArrowLeft, FiCreditCard, FiShield, FiCheck, FiAlertCircle } from 'react-icons/fi';

const TestCardInfo: React.FC = () => (
  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 mb-8 backdrop-blur-sm">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 bg-emerald-500 rounded-xl">
        <FiCreditCard className="w-5 h-5 text-white" />
      </div>
      <h4 className="text-emerald-800 font-bold text-lg">💳 Test Card Information</h4>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
        <span className="font-medium text-gray-700">Card Number:</span>
        <code className="bg-white px-2 py-1 rounded-lg border">4242 4242 4242 4242</code>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
        <span className="font-medium text-gray-700">Expiry:</span>
        <code className="bg-white px-2 py-1 rounded-lg border">12/34</code>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
        <span className="font-medium text-gray-700">CVC:</span>
        <code className="bg-white px-2 py-1 rounded-lg border">123</code>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
        <span className="font-medium text-gray-700">ZIP:</span>
        <code className="bg-white px-2 py-1 rounded-lg border">12345</code>
      </div>
    </div>
  </div>
);

const SecurityBadges: React.FC = () => (
  <div className="flex items-center justify-center gap-6 py-6 border-t border-b border-gray-200/60">
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <FiShield className="w-5 h-5 text-emerald-500" />
      <span>SSL Secure</span>
    </div>
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <FiCheck className="w-5 h-5 text-emerald-500" />
      <span>256-bit Encryption</span>
    </div>
  </div>
);

const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = loadStripe(publishableKey);

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);

  const query = new URLSearchParams(location.search);
  const courseId = query.get('courseId') || '';
  const amount = parseInt(query.get('amount') || '0');

  useEffect(() => {
    if (initRef.current) return;
    if (!courseId) {
      setError('Course ID is required');
      setLoading(false);
      return;
    }
    
    initRef.current = true;
    
    const init = async () => {
      try {
        setLoading(true);
        setError('');
        
        const [courseRes, paymentRes] = await Promise.all([
          courseService.getCourseById(courseId),
          paymentService.createStudentPayment(courseId, amount, 'stripe')
        ]);

        if (!paymentRes.clientSecret) {
          throw new Error('Failed to get client secret from server');
        }

        setCourse(courseRes.course);
        setClientSecret(paymentRes.clientSecret);
        setPaymentId(paymentRes.paymentId);
      } catch (err: any) {
        console.error('Initialization error:', err);
        setError(err.message || 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [courseId, amount]);

  const handleSuccess = () => {
    navigate('/payment/success', { 
      state: { 
        courseId, 
        courseName: course?.title, 
        amount: amount / 100
      },
      replace: true
    });
  };

  const handleCancel = () => {
    navigate('/courses', { replace: true });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiAlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Error</h2>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
              <button
                onClick={handleCancel}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-3 mx-auto"
              >
                <FiArrowLeft className="w-5 h-5" />
                Back to Courses
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="text-center py-12">
              <div className="relative inline-block mb-6">
                <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Preparing Your Payment</h3>
              <p className="text-gray-600">Securely connecting to payment processor...</p>
            </div>
            <TestCardInfo />
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret || !paymentId || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiAlertCircle className="w-10 h-10 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Setup Incomplete</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
                <p className="text-yellow-700 font-medium">
                  Payment initialization incomplete. Please try again.
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-3 mx-auto"
              >
                <FiArrowLeft className="w-5 h-5" />
                Back to Courses
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-6 transition-colors duration-200"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Courses
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent mb-4">
            Secure Checkout
          </h1>
          <p className="text-gray-600 text-lg">Complete your purchase with confidence</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Summary */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center">
                <FiCreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
                <p className="text-gray-600">Review your purchase details</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
                <img
                  src={course.thumbnail || '/default-course.jpg'}
                  alt={course.title}
                  className="w-20 h-20 object-cover rounded-xl"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{course.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {course.shortDescription || course.description}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Course Price</span>
                  <span className="font-bold text-gray-900">${(amount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Platform Fee</span>
                  <span className="text-gray-600">$0.00</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    ${(amount / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <SecurityBadges />

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <FiCheck className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">What's included:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Lifetime access to course content</li>
                      <li>• Certificate of completion</li>
                      <li>• 30-day money-back guarantee</li>
                      <li>• 24/7 customer support</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center">
                <FiShield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                <p className="text-gray-600">Secure SSL encrypted payment</p>
              </div>
            </div>

            <TestCardInfo />

            <Elements 
              stripe={stripePromise}
              options={{ 
                clientSecret,
                appearance: { 
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#059669',
                    colorBackground: '#ffffff',
                    colorText: '#1f2937',
                    colorDanger: '#dc2626',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    borderRadius: '12px',
                    spacingUnit: '4px'
                  }
                }
              }}
            >
              <PaymentForm
                clientSecret={clientSecret}
                paymentId={paymentId}
                courseId={courseId}
                amount={amount / 100}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
                isInstructorFee={false}
              />
            </Elements>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-8 bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-4 border border-white/40">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiShield className="w-5 h-5 text-emerald-500" />
              <span>256-bit SSL Encryption</span>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiCheck className="w-5 h-5 text-emerald-500" />
              <span>PCI DSS Compliant</span>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                <FiCheck className="w-3 h-3 text-white" />
              </div>
              <span>Money-Back Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;