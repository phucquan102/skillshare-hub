import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { paymentService } from '../../../services/api/paymentService';
import { courseService } from '../../../services/api/courseServices';
import PaymentForm from '../../../components/payment/PaymentForm/PaymentForm';

const TestCardInfo: React.FC = () => (
  <div className="test-card-info bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <h4 className="text-blue-800 font-semibold mb-2">💳 Test Card Information:</h4>
    <div className="text-sm text-gray-700">
      <p><strong>Successful card:</strong> 4242 4242 4242 4242</p>
      <p><strong>Expiry:</strong> 12/34</p>
      <p><strong>CVC:</strong> 123</p>
      <p><strong>ZIP:</strong> 12345</p>
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
          // Use correct function signature - pass individual parameters
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
      <div className="max-w-6xl mx-auto px-6 py-8 bg-white rounded-lg shadow-lg">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-[#4361ee] text-white rounded hover:bg-[#3a0ca3] transition"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 bg-white rounded-lg shadow-lg">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4361ee] mx-auto mb-4"></div>
          <p>Loading payment...</p>
        </div>
        <TestCardInfo />
      </div>
    );
  }

  if (!clientSecret || !paymentId || !course) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 bg-white rounded-lg shadow-lg">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Payment initialization incomplete. Please try again.
        </div>
        <button
          onClick={handleCancel}
          className="mt-4 px-4 py-2 bg-[#4361ee] text-white rounded hover:bg-[#3a0ca3] transition"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-[#3a0ca3] mb-2">
        Checkout: {course.title}
      </h2>
      <p className="text-gray-600 mb-6">
        Amount: ${(amount / 100).toFixed(2)}
      </p>

      <TestCardInfo />

      <Elements 
        stripe={stripePromise}
        options={{ 
          clientSecret,
          appearance: { 
            theme: 'stripe',
            variables: {
              colorPrimary: '#4361ee',
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
        />
      </Elements>
    </div>
  );
};

export default CheckoutPage;